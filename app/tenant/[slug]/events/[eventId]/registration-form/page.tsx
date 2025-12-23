"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailTemplateEditor } from "@/components/ui/email-template-editor";
import {
  Loader2,
  Calendar,
  MapPin,
  Share2,
  Eye,
  Mail,
  Copy,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  X,
  ArrowUp,
} from "lucide-react";
import { toast as sonnerToast } from "sonner";
import { LoadingScreen } from "@/components/ui/loading";
import { Progress } from "@/components/ui/progress";
import FormBuilder from "@/components/forms/FormBuilder";
import DynamicFormPreview from "@/components/forms/DynamicFormPreview";

interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  registration_form_title?: string;
  registration_form_description?: string;
  registration_deadline?: string;
}

interface Tenant {
  id: number;
  name: string;
  slug: string;
  country?: string;
  timezone?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  oc: string;
  contractStatus: string;
  contractType: string;
  genderIdentity: string;
  sex: string;
  pronouns: string;
  currentPosition: string;
  countryOfWork: string;
  projectOfWork: string;
  personalEmail: string;
  msfEmail: string;
  hrcoEmail: string;
  careerManagerEmail: string;
  lineManagerEmail: string;
  phoneNumber: string;
  travellingInternationally: string;
  travellingFromCountry: string;
  accommodationType: string;
  dietaryRequirements: string;
  accommodationNeeds: string;
  dailyMeals: string[];
  certificateName: string;
  badgeName: string;
  motivationLetter: string;
  codeOfConductConfirm: string;
  travelRequirementsConfirm: string;
}

export default function EventRegistrationFormPage() {
  const params = useParams();
  const { apiClient } = useAuthenticatedApi();
  const [event, setEvent] = useState<Event | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [ccEmails, setCcEmails] = useState("");
  const [bccEmails, setBccEmails] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    oc: "",
    contractStatus: "",
    contractType: "",
    genderIdentity: "",
    sex: "",
    pronouns: "",
    currentPosition: "",
    countryOfWork: "",
    projectOfWork: "",
    personalEmail: "",
    msfEmail: "",
    hrcoEmail: "",
    careerManagerEmail: "",
    lineManagerEmail: "",
    phoneNumber: "",
    travellingInternationally: "",
    travellingFromCountry: "",
    accommodationType: "",
    dietaryRequirements: "",
    accommodationNeeds: "",
    dailyMeals: [],
    certificateName: "",
    badgeName: "",
    motivationLetter: "",
    codeOfConductConfirm: "",
    travelRequirementsConfirm: "",
  });

  const [emailError, setEmailError] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [hasDietaryRequirements, setHasDietaryRequirements] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const tenantSlug = params.slug as string;
  const eventId = params.eventId as string;

  // Email template configuration variables
  const EMAIL_TEMPLATE_CONFIG = {
    greeting: "Dear Colleague,",
    invitationText: "We are pleased to invite you to register for the upcoming event:",
    sectionTitle: "Event Details:",
    instructionText: "To complete your registration, please click the link below and fill out the application form. The process takes approximately 8 minutes to complete.",
    deadlineReminder: "Please ensure you submit your application before the deadline to secure your participation.",
    supportText: "If you have any questions or need assistance, please don't hesitate to contact us.",
    closing: "Best regards,",
    signature: "MSF Event Team"
  };

  const steps = [
    {
      number: 1,
      title: "Personal Info",
      fields: [
        "firstName",
        "lastName",
        "oc",
        "contractStatus",
        "contractType",
        "genderIdentity",
        "sex",
        "pronouns",
        "currentPosition",
        "countryOfWork",
        "projectOfWork",
      ],
    },
    {
      number: 2,
      title: "Contact Details",
      fields: [
        "personalEmail",
        "msfEmail",
        "hrcoEmail",
        "careerManagerEmail",
        "lineManagerEmail",
        "phoneNumber",
      ],
    },
    {
      number: 3,
      title: "Travel & Accommodation",
      fields: [
        "travellingInternationally",
        "travellingFromCountry",
        "accommodationType",
        "dietaryRequirements",
        "accommodationNeeds",
        "dailyMeals",
      ],
    },
    {
      number: 4,
      title: "Final Details",
      fields: [
        "certificateName",
        "codeOfConductConfirm",
        "travelRequirementsConfirm",
      ],
    },
  ];

  const fetchCountries = useCallback(async () => {
    try {
      setLoadingCountries(true);
      const response = await apiClient.request<{countries: string[]}>('/countries');
      setCountries(response.countries || []);
    } catch (error) {
      console.error("Error fetching countries:", error);
      // Fallback to basic countries if API fails
      setCountries(["Kenya", "Uganda", "Tanzania", "Ethiopia", "South Sudan", "Somalia", "Other"]);
    } finally {
      setLoadingCountries(false);
    }
  }, [apiClient]);

  const fetchEvent = useCallback(async () => {
    try {
      const [eventData, tenantData] = await Promise.all([
        apiClient.request<Event>(`/events/${eventId}?tenant=${tenantSlug}`),
        apiClient.request<Tenant>(`/tenants/slug/${tenantSlug}`)
      ]);
      
      setEvent(eventData);
      setTenant(tenantData);
      setEmailSubject(`Registration: ${eventData.title}`);
      
      // Prefill email template with configurable content
      const defaultEmailBody = `${EMAIL_TEMPLATE_CONFIG.greeting}

${EMAIL_TEMPLATE_CONFIG.invitationText}

<strong>${eventData.title}</strong>

${EMAIL_TEMPLATE_CONFIG.sectionTitle}
• Date: ${new Date(eventData.start_date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })} - ${new Date(eventData.end_date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}
• Location: ${eventData.location}
${eventData.registration_deadline ? `• Registration Deadline: ${new Date(eventData.registration_deadline).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })} at ${new Date(eventData.registration_deadline).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })} (${tenantData?.timezone || 'Local timezone'})` : ''}

${EMAIL_TEMPLATE_CONFIG.instructionText}

${EMAIL_TEMPLATE_CONFIG.deadlineReminder}

${EMAIL_TEMPLATE_CONFIG.supportText}

${EMAIL_TEMPLATE_CONFIG.closing}
${EMAIL_TEMPLATE_CONFIG.signature}`;
      
      setEmailBody(defaultEmailBody);
    } catch (error: any) {
      const errorMessage = error?.message || error?.detail || "Failed to fetch event details";
      sonnerToast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [apiClient, eventId, tenantSlug]);

  useEffect(() => {
    fetchEvent();
    fetchCountries();

    // Clear form data on page unload for privacy
    const handleBeforeUnload = () => {
      setFormData({
        firstName: "", lastName: "", oc: "", contractStatus: "", contractType: "",
        genderIdentity: "", sex: "", pronouns: "", currentPosition: "", countryOfWork: "",
        projectOfWork: "", personalEmail: "", msfEmail: "", hrcoEmail: "",
        careerManagerEmail: "", lineManagerEmail: "", phoneNumber: "",
        travellingInternationally: "", travellingFromCountry: "", accommodationType: "", dietaryRequirements: "",
        accommodationNeeds: "", dailyMeals: [], certificateName: "", badgeName: "", motivationLetter: "",
        codeOfConductConfirm: "", travelRequirementsConfirm: ""
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [fetchEvent, fetchCountries]);

  // Scroll-to-top button visibility - Find the actual scrolling element
  useEffect(() => {
    let scrollContainer: any = null;

    const handleScroll = () => {
      // Get scroll position from all possible containers
      const windowScrollY = window.scrollY || window.pageYOffset;
      const main = document.querySelector('main');
      const mainScrollY = main ? (main as HTMLElement).scrollTop : 0;
      const containerScrollY = (scrollContainer && scrollContainer !== window) ? scrollContainer.scrollTop : 0;

      // Use the maximum scroll value
      const scrollY = Math.max(windowScrollY, mainScrollY, containerScrollY);
      setShowScrollTop(scrollY > 400);
    };

    // Setup with delay to ensure DOM is ready
    setTimeout(() => {
      const main = document.querySelector('main');
      scrollContainer = (main && main.scrollHeight > main.clientHeight) ? main : window;
      handleScroll();

      // Add listeners to multiple potential scroll containers
      window.addEventListener('scroll', handleScroll, { passive: true });
      if (scrollContainer && scrollContainer !== window) {
        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      }
      if (main && main !== scrollContainer) {
        main.addEventListener('scroll', handleScroll, { passive: true });
      }
    }, 500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollContainer && scrollContainer !== window) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      const main = document.querySelector('main');
      if (main && main !== scrollContainer) {
        main.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const main = document.querySelector('main');
    if (main) {
      (main as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear email error when user changes email
    if (field === 'personalEmail' || field === 'msfEmail') {
      setEmailError("");
    }
  };

  const checkEmailRegistration = async (personalEmail: string, msfEmail: string) => {
    if (!personalEmail.trim() && !msfEmail.trim()) return;
    
    setCheckingEmail(true);
    try {
      const response = await apiClient.request<{already_registered: boolean; message: string}>('/check-email-registration', {
        method: "POST",
        body: JSON.stringify({
          event_id: parseInt(eventId),
          personal_email: personalEmail,
          msf_email: msfEmail
        }),
      });
      
      if (response.already_registered) {
        setEmailError(response.message);
        return true;
      }
    } catch (error) {
      console.error("Error checking email:", error);
    } finally {
      setCheckingEmail(false);
    }
    return false;
  };

  const handleMealChange = (meal: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      dailyMeals: checked
        ? [...prev.dailyMeals, meal]
        : prev.dailyMeals.filter((m) => m !== meal),
    }));
  };

  const getStepRequiredFields = (stepNum: number) => {
    const required = [
      "firstName",
      "lastName",
      "oc",
      "contractStatus",
      "contractType",
      "genderIdentity",
      "sex",
      "pronouns",
      "currentPosition",
      "personalEmail",
      "phoneNumber",
      "travellingInternationally",
      "accommodationType",
      "codeOfConductConfirm",
      "travelRequirementsConfirm",
    ];

    const stepFields = steps.find((s) => s.number === stepNum)?.fields || [];
    return stepFields.filter((field) => required.includes(field));
  };

  const isStepValid = (stepNum: number) => {
    const requiredFields = getStepRequiredFields(stepNum);

    for (const field of requiredFields) {
      if (!formData[field as keyof FormData]) {
        return false;
      }
    }

    // Check if travelling from country is required for step 3
    if (stepNum === 3 && formData.travellingInternationally === "Yes" && !formData.travellingFromCountry) {
      return false;
    }

    if (
      stepNum === 3 &&
      formData.accommodationType === "Travelling daily" &&
      formData.dailyMeals.length === 0
    ) {
      return false;
    }

    return true;
  };

  const validateForm = () => {
    const required = [
      "firstName",
      "lastName",
      "oc",
      "contractStatus",
      "contractType",
      "genderIdentity",
      "sex",
      "pronouns",
      "currentPosition",
      "personalEmail",
      "phoneNumber",
      "travellingInternationally",
      "accommodationType",
      "codeOfConductConfirm",
      "travelRequirementsConfirm",
    ];

    if (
      formData.accommodationType === "Travelling daily" &&
      formData.dailyMeals.length === 0
    ) {
      sonnerToast.error("Required Field Missing", {
        description: "Please select at least one meal option",
      });
      return false;
    }

    for (const field of required) {
      if (!formData[field as keyof FormData]) {
        sonnerToast.error("Required Field Missing", {
          description: "Please fill in all required fields",
        });
        return false;
      }
    }

    // Check if travelling from country is required
    if (formData.travellingInternationally === "Yes" && !formData.travellingFromCountry) {
      sonnerToast.error("Required Field Missing", {
        description: "Please specify which country you are travelling from",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Check registration deadline before submitting
    if (
      event?.registration_deadline &&
      new Date() > new Date(event.registration_deadline)
    ) {
      sonnerToast.error("Registration Closed", {
        description: "The registration deadline has passed.",
      });
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.request(`/events/${eventId}/public-register`, {
        method: "POST",
        headers: { "X-Tenant-ID": tenantSlug },
        body: JSON.stringify({
          ...formData,
          eventId: parseInt(eventId),
        }),
      });

      sonnerToast.success("Registration Successful", {
        description:
          "Thank you for registering! You will be contacted with further details.",
      });

      // Clear form data for privacy - redirect to prevent back button access
      window.location.href = `/tenant/${tenantSlug}/events/${eventId}/participants`;
    } catch (error) {
      console.error("Registration error:", error);
      sonnerToast.error("Registration Failed", {
        description: "Please try again or contact support",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = async () => {
    // Admin preview mode - no validation required
    // Allow navigation through all steps without checking required fields
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return <LoadingScreen message="Loading event details..." />;
  }

  if (!event) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Event Not Found
            </h1>
            <p className="text-gray-600">
              The event you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const publicUrl = `${baseUrl}/public/event-registration/${eventId}`;
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    sonnerToast.success("Link Copied", {
      description: "Registration form link copied to clipboard",
    });
  };

  const handleEmailShare = async () => {
    const subject = emailSubject || `Registration: ${event?.title}`;
    
    // Format email body with proper HTML structure
    const formattedEmailBody = emailBody
      .replace(/\n/g, '<br>')
      .replace(/• /g, '&bull; ');
    
    const registrationLinkHtml = `
      <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: 600; color: #333;">Complete Your Registration</p>
        <a href="${publicUrl}" target="_blank" style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: 500; border-radius: 6px; margin: 10px 0;">Register Now</a>
        <p style="margin: 15px 0 0 0; font-size: 12px; color: #666; word-break: break-all;">Or copy and paste this link: ${publicUrl}</p>
      </div>
    `;
    
    const body = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="padding: 20px;">
          ${formattedEmailBody}
          ${registrationLinkHtml}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #666; text-align: center;">
            <p>This is an automated message from MSF Event Registration System.</p>
          </div>
        </div>
      </div>
    `;

    if (!recipientEmail) {
      sonnerToast.error("Email Required", {
        description: "Please enter at least one recipient email address.",
      });
      return;
    }
    
    const toEmails = recipientEmail.split(',').map(email => email.trim()).filter(email => email);
    const ccEmailsList = ccEmails ? ccEmails.split(',').map(email => email.trim()).filter(email => email) : [];
    const bccEmailsList = bccEmails ? bccEmails.split(',').map(email => email.trim()).filter(email => email) : [];
    
    try {
      setSendingEmail(true);
      // Send email via API
      await apiClient.request('/notifications/send-registration-email', {
        method: 'POST',
        body: JSON.stringify({
          to_email: toEmails[0], // Primary recipient
          cc_emails: [...toEmails.slice(1), ...ccEmailsList], // Additional recipients as CC
          bcc_emails: bccEmailsList, // BCC recipients
          subject: subject.replace(/[🌍🎯📧✉️📩💌📮📬📭📫🔔]/g, ''), // Remove emojis from subject
          message: body,
          registration_url: publicUrl,
          event_id: eventId
        })
      });

      const totalRecipients = toEmails.length + ccEmailsList.length + bccEmailsList.length;
      sonnerToast.success("Email Sent", {
        description: `Registration link sent to ${totalRecipients} recipient(s)`,
      });
    } catch {
      // Fallback to mailto
      const allCcEmails = [...toEmails.slice(1), ...ccEmailsList].join(',');
      const allBccEmails = bccEmailsList.join(',');
      const ccParam = allCcEmails ? `&cc=${encodeURIComponent(allCcEmails)}` : '';
      const bccParam = allBccEmails ? `&bcc=${encodeURIComponent(allBccEmails)}` : '';
      const mailtoUrl = `mailto:${encodeURIComponent(toEmails[0])}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}${ccParam}${bccParam}`;
      window.open(mailtoUrl);

      sonnerToast.success("Email Client Opened", {
        description: "Please send the email from your email client.",
      });
    } finally {
      setSendingEmail(false);
    }
    
    setShowShareModal(false);
  };

  const handlePreview = () => {
    console.log('👁️ ============ PREVIEW BUTTON CLICKED ============');
    console.log('👁️ Public URL:', publicUrl);
    console.log('👁️ Base URL:', process.env.NEXT_PUBLIC_BASE_URL || window.location.origin);
    console.log('👁️ Event ID:', eventId);
    console.log('👁️ Opening preview in new tab...');

    const newWindow = window.open(publicUrl, "_blank");

    if (!newWindow) {
      console.error('❌ Failed to open new window (popup blocked?)');
      sonnerToast.error("Preview Failed", {
        description: "Popup was blocked. Please allow popups for this site.",
      });
    } else {
      console.log('✅ Preview window opened successfully');
    }

    console.log('👁️ ============ PREVIEW COMPLETE ============');
  };

  const isDeadlinePassed = event?.registration_deadline && new Date() > new Date(event.registration_deadline);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="w-full max-w-none mx-auto px-1 sm:px-2 lg:px-4 xl:px-6 py-6 space-y-6">
          {/* Event Header */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-indigo-50">
            <CardHeader className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{tenantSlug.toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">
                        {tenantSlug.toUpperCase() === 'OCA' ? 'Médecins Sans Frontières' : tenantSlug.toUpperCase()}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Registration Portal
                      </p>
                    </div>
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    {event.registration_form_title ||
                      `${event.title} - Application Form`}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mb-4">
                    Complete the application form below. Takes approximately 8
                    minutes.
                  </p>
                </div>
                <div className="flex gap-2 self-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/tenant/${tenantSlug}/events`}
                    className="flex items-center gap-2 bg-white"
                  >
                    <X className="w-4 h-4" />
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreview}
                    disabled={isDeadlinePassed}
                    className="flex items-center gap-2 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isDeadlinePassed ? "Registration deadline has passed" : "Preview registration form"}
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowShareModal(true)}
                    disabled={isDeadlinePassed}
                    className="flex items-center gap-2 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isDeadlinePassed ? "Registration deadline has passed" : "Share registration form"}
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-red-600" />
                  <span>
                    {new Date(event.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(event.end_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>{event.location}</span>
                </div>
                {event.registration_deadline && (
                  <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg text-red-700">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      Application Deadline:{" "}
                      {new Date(event.registration_deadline).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}{" "}
                      at{" "}
                      {new Date(event.registration_deadline).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        }
                      )}{" "}
                      <span className="text-red-600 font-normal">
                        ({tenant?.timezone || 'Local timezone'})
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Admin Preview Banner */}
          <div className="bg-blue-50 border-2 border-blue-500 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Admin Preview Mode</h3>
                <p className="text-sm text-blue-700">
                  You can navigate through all form steps without filling required fields. This form cannot be submitted.
                </p>
              </div>
            </div>
          </div>



          {/* Share Modal */}
          <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col bg-white p-0 gap-0">
              <DialogHeader className="px-6 pt-6 pb-4 border-b">
                <DialogTitle className="text-xl font-semibold">Share Application Form</DialogTitle>
              </DialogHeader>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Registration Link
                  </p>
                  <p className="text-xs text-gray-600 break-all font-mono bg-white p-2 rounded border">
                    {publicUrl}
                  </p>
                </div>

                <Button
                  onClick={handleCopyLink}
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-10"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>

                <div className="border-t pt-4 space-y-3">
                  <div>
                    <Label
                      htmlFor="recipientEmail"
                      className="text-sm font-medium text-gray-700"
                    >
                      Send To <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="recipientEmail"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="recipient1@example.com, recipient2@example.com"
                      className="mt-1.5 h-10 border-gray-300 focus:border-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
                  </div>
                  <div>
                    <Label
                      htmlFor="ccEmails"
                      className="text-sm font-medium text-gray-700"
                    >
                      CC (Optional)
                    </Label>
                    <Input
                      id="ccEmails"
                      value={ccEmails}
                      onChange={(e) => setCcEmails(e.target.value)}
                      placeholder="cc1@example.com, cc2@example.com"
                      className="mt-1.5 h-10 border-gray-300 focus:border-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
                  </div>
                  <div>
                    <Label
                      htmlFor="bccEmails"
                      className="text-sm font-medium text-gray-700"
                    >
                      BCC (Optional)
                    </Label>
                    <Input
                      id="bccEmails"
                      value={bccEmails}
                      onChange={(e) => setBccEmails(e.target.value)}
                      placeholder="bcc1@example.com, bcc2@example.com"
                      className="mt-1.5 h-10 border-gray-300 focus:border-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
                  </div>
                  <div>
                    <Label
                      htmlFor="emailSubject"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email Subject
                    </Label>
                    <Input
                      id="emailSubject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder={`Registration: ${event?.title}`}
                      className="mt-1.5 h-10 border-gray-300 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emailBody" className="text-sm font-medium text-gray-700 mb-2 block">
                      Email Template
                    </Label>
                    <EmailTemplateEditor
                      value={emailBody}
                      onChange={setEmailBody}
                      registrationUrl={publicUrl}
                      eventTitle={event?.title || ''}
                      eventData={event}
                      tenantData={tenant}
                      placeholder={`Please register for ${event?.title} using the link provided.`}
                      height={350}
                      protectedContent={`<a href="${publicUrl}" target="_blank" style="color: #dc2626; text-decoration: underline;">${publicUrl}</a>`}
                    />
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="px-6 py-4 border-t bg-gray-50">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowShareModal(false)}
                    className="flex-1 h-10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleEmailShare}
                    disabled={!recipientEmail || sendingEmail}
                    className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Form Builder */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl text-gray-900">Form Builder</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Customize your event registration form by adding, editing, or removing fields
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <FormBuilder eventId={parseInt(eventId)} onSave={() => window.location.reload()} />
            </CardContent>
          </Card>

        </div>

        {/* Floating Scroll-to-Top Button */}
        <Button
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 z-[9999] w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-2xl transition-all duration-300 hover:scale-110 ${showScrollTop ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          size="icon"
          aria-label="Scroll to top"
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 9999,
          }}
        >
          <ArrowUp className="h-6 w-6" />
        </Button>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
