"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Select from "react-select";
import { toast as sonnerToast } from "sonner";

const CKEditor = dynamic(() => import("@ckeditor/ckeditor5-react").then(mod => ({ default: mod.CKEditor })), { ssr: false });

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
  tenant_slug?: string;
}

interface Tenant {
  slug: string;
  name: string;
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

export default function PublicEventRegistrationPage() {
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [hasDietaryRequirements, setHasDietaryRequirements] = useState(false);
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
  const [editorLoaded, setEditorLoaded] = useState(false);
  const editorRef = useRef<any>(null);

  const eventId = params.eventId as string;

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

  const fetchCountries = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/countries/`
      );
      if (response.ok) {
        const data = await response.json();
        setCountries(data.countries);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  const fetchEvent = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/public`
      );
      if (!response.ok) throw new Error("Failed to fetch event");
      const eventData = await response.json();
      setEvent(eventData);
      
      // Extract tenant from event or URL
      if (eventData.tenant_slug) {
        setTenant({ slug: eventData.tenant_slug, name: eventData.tenant_slug.toUpperCase() });
      } else {
        // Fallback: try to get tenant from URL or default to OCA
        const urlPath = window.location.pathname;
        const tenantMatch = urlPath.match(/\/tenant\/([^/]+)/);
        const tenantSlug = tenantMatch ? tenantMatch[1] : 'oca';
        setTenant({ slug: tenantSlug, name: tenantSlug.toUpperCase() });
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      sonnerToast.error("Error", {
        description: "Failed to fetch event details",
      });
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
    fetchCountries();

    // Load CKEditor
    if (typeof window !== 'undefined') {
      import('@ckeditor/ckeditor5-build-classic')
        .then((module) => {
          editorRef.current = module.default;
          setEditorLoaded(true);
        })
        .catch((error) => {
          console.error('Error loading CKEditor:', error);
        });
    }

    // Clear form data on page unload for privacy
    const handleBeforeUnload = () => {
      setFormData({
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
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [fetchEvent]);

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/check-email-registration`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: parseInt(eventId),
            personal_email: personalEmail,
            msf_email: msfEmail
          }),
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.already_registered) {
          setEmailError(result.message);
          return true;
        }
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
      
      const registrationData = {
        ...formData,
        eventId: parseInt(eventId),
      };
      
      console.log('🔥 FRONTEND DEBUG: Registration data being sent:', registrationData);
      console.log('🔥 FRONTEND DEBUG: travellingInternationally =', registrationData.travellingInternationally);
      console.log('🔥 FRONTEND DEBUG: accommodationType =', registrationData.accommodationType);
      console.log('🔥 FRONTEND DEBUG: dailyMeals =', registrationData.dailyMeals);
      console.log('🔥 FRONTEND DEBUG: dietaryRequirements =', registrationData.dietaryRequirements);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/events/${eventId}/public-register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(registrationData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      sonnerToast.success("Registration Successful", {
        description: "Thank you for registering! You will be contacted with further details.",
      });

      // Clear form data for privacy - redirect to prevent back button access
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      window.location.href = `${baseUrl}/public/event-registration/${eventId}/success`;
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
    if (currentStep === 2) {
      // Check email registration before proceeding from contact details
      const emailExists = await checkEmailRegistration(formData.personalEmail, formData.msfEmail);
      if (emailExists) {
        sonnerToast.error("Email Already Registered", {
          description: "This email is already registered for this event. Please use a different email.",
        });
        return;
      }
    }

    if (isStepValid(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      sonnerToast.error("Required Fields Missing", {
        description: "Please complete all required fields before proceeding",
      });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Event Not Found
          </h1>
          <p className="text-gray-600">
            The event you&apos;re looking for doesn&apos;t exist.
          </p>
        </div>
      </div>
    );
  }

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  // Check if registration is closed
  const isRegistrationClosed =
    event?.registration_deadline &&
    new Date() > new Date(event.registration_deadline);

  if (isRegistrationClosed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12 max-w-md mx-auto">
          <Clock className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Applications Closed
          </h1>
          <p className="text-gray-600 mb-4">
            Applications for this event closed on{" "}
            {event.registration_deadline &&
              new Date(event.registration_deadline).toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}
            .
          </p>
          <p className="text-sm text-gray-500">
            Please contact the event organizers if you have any questions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="w-full max-w-none mx-auto px-1 sm:px-2 lg:px-4 xl:px-6 py-6 space-y-6">
        {/* Event Header */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-indigo-50">
          <CardHeader className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{tenant?.name || 'MSF'}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">
                      {tenant?.name === 'OCA' ? 'Médecins Sans Frontières' : tenant?.name || 'Médecins Sans Frontières'}
                    </h3>
                    <p className="text-xs text-gray-500">Registration Portal</p>
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
                    )}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Progress Bar */}
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Step {currentStep} of {steps.length}
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="flex justify-between">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="flex flex-col items-center flex-1"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step.number < currentStep
                        ? "bg-green-500 text-white"
                        : step.number === currentStep
                        ? "bg-red-600 text-white ring-4 ring-red-100"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step.number < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center hidden sm:block ${
                      step.number === currentStep
                        ? "text-red-600 font-semibold"
                        : "text-gray-600"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Content */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Personal Information
                  </h2>
                  <p className="text-gray-600">
                    Please provide your basic personal details
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-medium flex items-center gap-1"
                    >
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-gray-500">
                      As stated in passport
                    </p>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      className="border-2 focus:border-red-500 h-10"
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-sm font-medium flex items-center gap-1"
                    >
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-gray-500">
                      As stated in passport
                    </p>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      className="border-2 focus:border-red-500 h-10"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    What is your OC? <span className="text-red-500">*</span>
                  </Label>
                  <RadioGroup
                    value={formData.oc}
                    onValueChange={(value) => handleInputChange("oc", value)}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                  >
                    {["OCA", "OCB", "OCBA", "OCG", "OCP", "WACA"].map((oc) => (
                      <div
                        key={oc}
                        onClick={() => handleInputChange("oc", oc)}
                        className={`flex items-center space-x-2 p-2.5 border-2 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer ${
                          formData.oc === oc ? 'border-red-500 bg-red-50' : 'border-gray-200'
                        }`}
                      >
                        <RadioGroupItem value={oc} id={oc} className="pointer-events-none" />
                        <Label
                          htmlFor={oc}
                          className="font-medium cursor-pointer pointer-events-none"
                        >
                          {oc}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    Contract Status <span className="text-red-500">*</span>
                  </Label>
                  <RadioGroup
                    value={formData.contractStatus}
                    onValueChange={(value) =>
                      handleInputChange("contractStatus", value)
                    }
                    className="space-y-2"
                  >
                    {["On contract", "Between contracts"].map((status) => (
                      <div
                        key={status}
                        onClick={() => handleInputChange("contractStatus", status)}
                        className={`flex items-center space-x-2 p-2.5 border-2 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer ${
                          formData.contractStatus === status ? 'border-red-500 bg-red-50' : 'border-gray-200'
                        }`}
                      >
                        <RadioGroupItem value={status} id={status} className="pointer-events-none" />
                        <Label
                          htmlFor={status}
                          className="cursor-pointer flex-1 pointer-events-none"
                        >
                          {status}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    Type of Contract <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-gray-500">
                    HQ = Headquarters Contract | IMS = International Mobile
                    Staff | LRS = Locally Recruited Staff
                  </p>
                  <RadioGroup
                    value={formData.contractType}
                    onValueChange={(value) =>
                      handleInputChange("contractType", value)
                    }
                    className="grid grid-cols-2 gap-2"
                  >
                    {["HQ", "IMS", "LRS", "Other"].map((type) => (
                      <div
                        key={type}
                        onClick={() => handleInputChange("contractType", type)}
                        className={`flex items-center space-x-2 p-2.5 border-2 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer ${
                          formData.contractType === type ? 'border-red-500 bg-red-50' : 'border-gray-200'
                        }`}
                      >
                        <RadioGroupItem value={type} id={type} className="pointer-events-none" />
                        <Label htmlFor={type} className="cursor-pointer pointer-events-none">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      Gender Identity <span className="text-red-500">*</span>
                    </Label>
                    <RadioGroup
                      value={formData.genderIdentity}
                      onValueChange={(value) =>
                        handleInputChange("genderIdentity", value)
                      }
                      className="space-y-1.5"
                    >
                      {[
                        "Man",
                        "Woman",
                        "Non-binary",
                        "Prefer to self-describe",
                        "Prefer not to disclose",
                      ].map((gender) => (
                        <div
                          key={gender}
                          onClick={() => handleInputChange("genderIdentity", gender)}
                          className={`flex items-center space-x-2 p-2 border-2 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer ${
                            formData.genderIdentity === gender ? 'border-red-500 bg-red-50' : 'border-gray-200'
                          }`}
                        >
                          <RadioGroupItem value={gender} id={gender} className="pointer-events-none" />
                          <Label
                            htmlFor={gender}
                            className="text-sm cursor-pointer pointer-events-none flex-1"
                          >
                            {gender}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      Sex <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-gray-500">
                      As indicated in your passport
                    </p>
                    <RadioGroup
                      value={formData.sex}
                      onValueChange={(value) => handleInputChange("sex", value)}
                      className="space-y-1.5"
                    >
                      {["Female", "Male", "Other"].map((sex) => (
                        <div
                          key={sex}
                          onClick={() => handleInputChange("sex", sex)}
                          className={`flex items-center space-x-2 p-2 border-2 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer ${
                            formData.sex === sex ? 'border-red-500 bg-red-50' : 'border-gray-200'
                          }`}
                        >
                          <RadioGroupItem value={sex} id={sex} className="pointer-events-none" />
                          <Label
                            htmlFor={sex}
                            className="text-sm cursor-pointer pointer-events-none flex-1"
                          >
                            {sex}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      Pronouns <span className="text-red-500">*</span>
                    </Label>
                    <RadioGroup
                      value={formData.pronouns}
                      onValueChange={(value) =>
                        handleInputChange("pronouns", value)
                      }
                      className="space-y-1.5"
                    >
                      {["He / him", "She / her", "They / Them", "Other"].map(
                        (pronoun) => (
                          <div
                            key={pronoun}
                            onClick={() => handleInputChange("pronouns", pronoun)}
                            className={`flex items-center space-x-2 p-2 border-2 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer ${
                              formData.pronouns === pronoun ? 'border-red-500 bg-red-50' : 'border-gray-200'
                            }`}
                          >
                            <RadioGroupItem value={pronoun} id={pronoun} className="pointer-events-none" />
                            <Label
                              htmlFor={pronoun}
                              className="text-sm cursor-pointer pointer-events-none flex-1"
                            >
                              {pronoun}
                            </Label>
                          </div>
                        )
                      )}
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="currentPosition"
                    className="text-sm font-medium flex items-center gap-1"
                  >
                    Current (or most recent) Position{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="currentPosition"
                    value={formData.currentPosition}
                    onChange={(e) =>
                      handleInputChange("currentPosition", e.target.value)
                    }
                    className="border-2 focus:border-red-500 h-10"
                    placeholder="e.g., Project Coordinator"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="countryOfWork"
                      className="text-sm font-medium"
                    >
                      Country of Work
                    </Label>
                    <p className="text-xs text-gray-500">
                      Leave blank if between programs
                    </p>
                    <Select
                      id="countryOfWork"
                      value={
                        countries.find(
                          (country) => country === formData.countryOfWork
                        )
                          ? {
                              value: formData.countryOfWork,
                              label: formData.countryOfWork,
                            }
                          : null
                      }
                      onChange={(option) =>
                        handleInputChange("countryOfWork", option?.value || "")
                      }
                      options={countries.map((country) => ({
                        value: country,
                        label: country,
                      }))}
                      placeholder="Select country..."
                      isClearable
                      isSearchable
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          border: "2px solid #e5e7eb",
                          borderRadius: "0.5rem",
                          padding: "0.25rem",
                          "&:hover": { borderColor: "#ef4444" },
                          "&:focus-within": {
                            borderColor: "#ef4444",
                            boxShadow: "none",
                          },
                        }),
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="projectOfWork"
                      className="text-sm font-medium"
                    >
                      Project of Work
                    </Label>
                    <p className="text-xs text-gray-500">
                      Leave blank if not applicable
                    </p>
                    <Input
                      id="projectOfWork"
                      value={formData.projectOfWork}
                      onChange={(e) =>
                        handleInputChange("projectOfWork", e.target.value)
                      }
                      className="border-2 focus:border-red-500 h-10"
                      placeholder="e.g., Nairobi Project"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Contact Details
                  </h2>
                  <p className="text-gray-600">
                    Provide your email addresses and phone number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="personalEmail"
                    className="text-sm font-medium flex items-center gap-1"
                  >
                    Personal/Tembo Email Address{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-gray-500">
                    This will be used for all communication. If on Tembo, use
                    that email.
                  </p>
                  <Input
                    id="personalEmail"
                    type="email"
                    value={formData.personalEmail}
                    onChange={(e) =>
                      handleInputChange("personalEmail", e.target.value)
                    }
                    className={`border-2 focus:border-red-500 h-10 ${emailError ? 'border-red-500' : ''}`}
                    placeholder="your.email@example.com"
                  />
                  {emailError && (
                    <p className="text-red-500 text-sm mt-1">{emailError}</p>
                  )}
                  {checkingEmail && (
                    <p className="text-blue-500 text-sm mt-1 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Checking email...
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="msfEmail" className="text-sm font-medium">
                      MSF Email
                    </Label>
                    <Input
                      id="msfEmail"
                      type="email"
                      value={formData.msfEmail}
                      onChange={(e) =>
                        handleInputChange("msfEmail", e.target.value)
                      }
                      className="border-2 focus:border-red-500 h-10"
                      placeholder="your.name@msf.org"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hrcoEmail" className="text-sm font-medium">
                      HRCo Email
                    </Label>
                    <Input
                      id="hrcoEmail"
                      type="email"
                      value={formData.hrcoEmail}
                      onChange={(e) =>
                        handleInputChange("hrcoEmail", e.target.value)
                      }
                      className="border-2 focus:border-red-500 h-10"
                      placeholder="hrco@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="careerManagerEmail"
                      className="text-sm font-medium"
                    >
                      Career Manager Email
                    </Label>
                    <Input
                      id="careerManagerEmail"
                      type="email"
                      value={formData.careerManagerEmail}
                      onChange={(e) =>
                        handleInputChange("careerManagerEmail", e.target.value)
                      }
                      className="border-2 focus:border-red-500 h-10"
                      placeholder="manager@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="lineManagerEmail"
                      className="text-sm font-medium"
                    >
                      Line Manager Email
                    </Label>
                    <p className="text-xs text-gray-500">
                      If not {tenant?.name || 'OCA'}, add hosting OC email
                    </p>
                    <Input
                      id="lineManagerEmail"
                      type="email"
                      value={formData.lineManagerEmail}
                      onChange={(e) =>
                        handleInputChange("lineManagerEmail", e.target.value)
                      }
                      className="border-2 focus:border-red-500 h-10"
                      placeholder="line.manager@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="phoneNumber"
                      className="text-sm font-medium flex items-center gap-1"
                    >
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-gray-500">
                      Include country code (e.g., 00 30 123456789)
                    </p>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      className="border-2 focus:border-red-500 h-10"
                      placeholder="00 XX XXXXXXXXX"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Travel & Accommodation */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Travel & Accommodation
                  </h2>
                  <p className="text-gray-600">
                    Tell us about your travel and accommodation needs
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    Will you be travelling internationally for this event?{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <RadioGroup
                    value={formData.travellingInternationally}
                    onValueChange={(value) =>
                      handleInputChange("travellingInternationally", value)
                    }
                    className="space-y-2"
                  >
                    {["Yes", "No"].map((option) => (
                      <div
                        key={option}
                        className={`flex items-center space-x-2 p-2.5 border-2 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer ${
                          formData.travellingInternationally === option ? 'border-red-500 bg-red-50' : 'border-gray-200'
                        }`}
                        onClick={() => handleInputChange("travellingInternationally", option)}
                      >
                        <RadioGroupItem
                          value={option}
                          id={`travel-${option}`}
                          className="pointer-events-none"
                        />
                        <Label
                          htmlFor={`travel-${option}`}
                          className="cursor-pointer flex-1 pointer-events-none"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {formData.travellingInternationally === "Yes" && (
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-1">
                      What is your nationality? <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={
                        countries.find(
                          (country) => country === formData.travellingFromCountry
                        )
                          ? {
                              value: formData.travellingFromCountry,
                              label: formData.travellingFromCountry,
                            }
                          : null
                      }
                      onChange={(option) =>
                        handleInputChange("travellingFromCountry", option?.value || "")
                      }
                      options={countries.map((country) => ({
                        value: country,
                        label: country,
                      }))}
                      placeholder="Select country..."
                      isClearable
                      isSearchable
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          border: "2px solid #3b82f6",
                          borderRadius: "0.5rem",
                          padding: "0.25rem",
                          backgroundColor: "white",
                          "&:hover": { borderColor: "#3b82f6" },
                          "&:focus-within": {
                            borderColor: "#3b82f6",
                            boxShadow: "none",
                          },
                        }),
                      }}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    Accommodation Type <span className="text-red-500">*</span>
                  </Label>
                  <p className="text-xs text-gray-500 mb-2">
                    {tenant?.name || 'OCA'} provides free accommodation for all participants
                  </p>
                  <RadioGroup
                    value={formData.accommodationType}
                    onValueChange={(value) =>
                      handleInputChange("accommodationType", value)
                    }
                    className="space-y-2"
                  >
                    <div
                      onClick={() => handleInputChange("accommodationType", "Staying at accommodation")}
                      className={`flex items-center space-x-2 p-3 border-2 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer ${
                        formData.accommodationType === "Staying at accommodation" ? 'border-red-500 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      <RadioGroupItem
                        value="Staying at accommodation"
                        id="staying"
                        className="pointer-events-none"
                      />
                      <Label
                        htmlFor="staying"
                        className="cursor-pointer flex-1 pointer-events-none"
                      >
                        <span className="font-medium">
                          Staying at {tenant?.name || 'MSF'} accommodation overnight
                        </span>
                      </Label>
                    </div>
                    <div
                      onClick={() => handleInputChange("accommodationType", "Travelling daily")}
                      className={`flex items-center space-x-2 p-3 border-2 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer ${
                        formData.accommodationType === "Travelling daily" ? 'border-red-500 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      <RadioGroupItem
                        value="Travelling daily"
                        id="travelling"
                        className="pointer-events-none"
                      />
                      <Label
                        htmlFor="travelling"
                        className="cursor-pointer flex-1 pointer-events-none"
                      >
                        <span className="font-medium">
                          Travelling daily and staying elsewhere
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.accommodationType === "Travelling daily" && (
                  <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 space-y-4">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        Which meals would you like at the venue?{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="space-y-2">
                        {["Breakfast", "Lunch", "Dinner", "Other"].map(
                          (meal) => (
                            <div
                              key={meal}
                              className="flex items-center space-x-2 p-3 bg-white border rounded-lg hover:bg-red-50 transition-all"
                            >
                              <input
                                type="checkbox"
                                id={meal}
                                checked={formData.dailyMeals.includes(meal)}
                                onChange={(e) =>
                                  handleMealChange(meal, e.target.checked)
                                }
                                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                              />
                              <Label
                                htmlFor={meal}
                                className="cursor-pointer flex-1"
                              >
                                {meal}
                              </Label>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 p-3 border-2 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      id="hasDietaryRequirements"
                      checked={hasDietaryRequirements}
                      onChange={(e) => {
                        setHasDietaryRequirements(e.target.checked);
                        if (!e.target.checked) {
                          handleInputChange("dietaryRequirements", "");
                        }
                      }}
                      className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                    />
                    <Label
                      htmlFor="hasDietaryRequirements"
                      className="cursor-pointer flex-1 font-medium"
                    >
                      I have special dietary requirements
                    </Label>
                  </div>
                  
                  {hasDietaryRequirements && (
                    <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 space-y-2">
                      <Label
                        htmlFor="dietaryRequirements"
                        className="text-sm font-medium"
                      >
                        Please specify your dietary requirements
                      </Label>
                      <p className="text-xs text-gray-600">
                        Include religious, cultural, or medical requirements
                        (e.g., Halal, vegetarian, allergies)
                      </p>
                      <div className="border-2 rounded-lg bg-white">
                        {editorLoaded && editorRef.current ? (
                          <CKEditor
                            editor={editorRef.current}
                            data={formData.dietaryRequirements}
                            onChange={(_event: any, editor: any) => {
                              const data = editor.getData();
                              handleInputChange("dietaryRequirements", data);
                            }}
                            config={{
                              toolbar: ['bold', 'italic', 'bulletedList', 'numberedList', 'undo', 'redo'],
                              placeholder: "e.g., Vegetarian, no nuts, Halal food only",
                            }}
                          />
                        ) : (
                          <div className="p-3 text-sm text-gray-500">Loading editor...</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="accommodationNeeds"
                    className="text-sm font-medium"
                  >
                    Accommodation Needs or Requirements
                  </Label>
                  <p className="text-xs text-gray-500">
                    Any special requirements we should know about? Note: Single
                    rooms are not available.
                  </p>
                  <div className="border-2 rounded-lg bg-white">
                    {editorLoaded && editorRef.current ? (
                      <CKEditor
                        editor={editorRef.current}
                        data={formData.accommodationNeeds}
                        onChange={(_event: any, editor: any) => {
                          const data = editor.getData();
                          handleInputChange("accommodationNeeds", data);
                        }}
                        config={{
                          toolbar: ['bold', 'italic', 'bulletedList', 'numberedList', 'undo', 'redo'],
                          placeholder: "Any special requirements...",
                        }}
                      />
                    ) : (
                      <div className="p-3 text-sm text-gray-500">Loading editor...</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Final Details */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Final Details
                  </h2>
                  <p className="text-gray-600">
                    Just a few more details to complete your registration
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500 space-y-4">
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-2">
                      Certificate Name
                    </h3>
                    <p className="text-sm text-purple-800 mb-3">
                      If a certificate is awarded, how would you like your name to appear?
                    </p>
                    <Input
                      id="certificateName"
                      value={formData.certificateName}
                      onChange={(e) =>
                        handleInputChange("certificateName", e.target.value)
                      }
                      className="border-2 focus:border-purple-500 bg-white h-10"
                      placeholder="e.g., Dr. Jane Elizabeth Smith"
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-2">
                      Badge Name
                    </h3>
                    <p className="text-sm text-purple-800 mb-3">
                      How would you like your name to appear on your event badge?
                    </p>
                    <Input
                      id="badgeName"
                      value={formData.badgeName}
                      onChange={(e) =>
                        handleInputChange("badgeName", e.target.value)
                      }
                      className="border-2 focus:border-purple-500 bg-white h-10"
                      placeholder="e.g., Jane Smith"
                    />
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Motivation Letter
                  </h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Please explain your motivation for attending this event and how it aligns with your role and development goals.
                  </p>
                  <div className="border-2 border-blue-300 rounded-lg bg-white">
                    {editorLoaded && editorRef.current ? (
                      <CKEditor
                        editor={editorRef.current}
                        data={formData.motivationLetter}
                        onChange={(_event: any, editor: any) => {
                          const data = editor.getData();
                          handleInputChange("motivationLetter", data);
                        }}
                        config={{
                          toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|', 'blockQuote', 'undo', 'redo'],
                          placeholder: "Please describe your motivation for attending this event...",
                        }}
                      />
                    ) : (
                      <div className="p-3 text-sm text-gray-500">Loading editor...</div>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500 space-y-4">
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">
                      MSF Code of Conduct
                    </h3>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        I confirm that I have read and will abide by the {tenant?.name || 'MSF'}
                        code of conduct <span className="text-red-500">*</span>
                      </Label>
                      <RadioGroup
                        value={formData.codeOfConductConfirm}
                        onValueChange={(value) =>
                          handleInputChange("codeOfConductConfirm", value)
                        }
                      >
                        <div
                          onClick={() => handleInputChange("codeOfConductConfirm", "Yes")}
                          className={`flex items-center space-x-2 p-2.5 bg-white border-2 rounded-lg hover:border-amber-500 transition-all cursor-pointer ${
                            formData.codeOfConductConfirm === "Yes" ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                          }`}
                        >
                          <RadioGroupItem value="Yes" id="conduct-yes" className="pointer-events-none" />
                          <Label
                            htmlFor="conduct-yes"
                            className="cursor-pointer pointer-events-none flex-1"
                          >
                            Yes, I confirm
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500 space-y-4">
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">
                      Important Travel Information
                    </h3>
                    <div className="text-sm text-red-800 space-y-2 mb-4">
                      <p>
                        • Check vaccination and travel requirements for the host
                        country
                      </p>
                      <p>
                        • Verify re-entry requirements for your home/work
                        country
                      </p>
                      <p>• HRCOs book travel for country program staff</p>

                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-1">
                        I confirm I have read and understood the above{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <RadioGroup
                        value={formData.travelRequirementsConfirm}
                        onValueChange={(value) =>
                          handleInputChange("travelRequirementsConfirm", value)
                        }
                      >
                        <div
                          onClick={() => handleInputChange("travelRequirementsConfirm", "Yes")}
                          className={`flex items-center space-x-2 p-2.5 bg-white border-2 rounded-lg hover:border-red-500 transition-all cursor-pointer ${
                            formData.travelRequirementsConfirm === "Yes" ? 'border-red-500 bg-red-50' : 'border-gray-200'
                          }`}
                        >
                          <RadioGroupItem value="Yes" id="travel-confirm-yes" className="pointer-events-none" />
                          <Label
                            htmlFor="travel-confirm-yes"
                            className="cursor-pointer pointer-events-none flex-1"
                          >
                            Yes, I confirm
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between pt-8 border-t mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="w-full sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={emailError !== "" || checkingEmail}
                  className="w-full sm:w-auto bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400"
                >
                  {checkingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    !isStepValid(currentStep) ||
                    (event?.registration_deadline && new Date() > new Date(event.registration_deadline))
                  }
                  className="w-full sm:w-auto bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400"
                  title={
                    event?.registration_deadline && new Date() > new Date(event.registration_deadline)
                      ? "Application deadline has passed"
                      : ""
                  }
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2 text-white" />
                      Submit Application
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
