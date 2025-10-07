"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthenticatedApi } from "@/lib/auth";
import DashboardLayout from "@/components/layout/dashboard-layout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, MapPin, Share2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { LoadingScreen } from "@/components/ui/loading";

interface Event {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  registration_form_title?: string;
  registration_form_description?: string;
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
  accommodationType: string;
  dietaryRequirements: string;
  accommodationNeeds: string;
  dailyMeals: string[];
  certificateName: string;
  codeOfConductConfirm: string;
  travelRequirementsConfirm: string;
}

export default function EventRegistrationFormPage() {
  const params = useParams();
  const router = useRouter();
  const { apiClient } = useAuthenticatedApi();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    accommodationType: "",
    dietaryRequirements: "",
    accommodationNeeds: "",
    dailyMeals: [],
    certificateName: "",
    codeOfConductConfirm: "",
    travelRequirementsConfirm: "",
  });

  const tenantSlug = params.slug as string;
  const eventId = params.eventId as string;

  const fetchEvent = useCallback(async () => {
    try {
      const eventData = await apiClient.request<Event>(`/events/${eventId}`, {
        headers: { "X-Tenant-ID": tenantSlug },
      });
      setEvent(eventData);
    } catch (error) {
      console.error("Error fetching event:", error);
      toast({
        title: "Error",
        description: "Failed to fetch event details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [apiClient, eventId, tenantSlug]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMealChange = (meal: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      dailyMeals: checked 
        ? [...prev.dailyMeals, meal]
        : prev.dailyMeals.filter(m => m !== meal)
    }));
  };

  const validateForm = () => {
    const required = [
      'firstName', 'lastName', 'oc', 'contractStatus', 'contractType',
      'genderIdentity', 'sex', 'pronouns', 'currentPosition', 'personalEmail',
      'phoneNumber', 'travellingInternationally', 'accommodationType',
      'codeOfConductConfirm', 'travelRequirementsConfirm'
    ];
    
    // Additional validation for daily meals if travelling daily
    if (formData.accommodationType === 'Travelling daily' && formData.dailyMeals.length === 0) {
      toast({
        title: "Required Field Missing",
        description: "Please select at least one meal option",
        variant: "destructive",
      });
      return false;
    }
    
    for (const field of required) {
      if (!formData[field as keyof FormData]) {
        toast({
          title: "Required Field Missing",
          description: `Please fill in all required fields`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

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

      toast({
        title: "Registration Successful",
        description: "Thank you for registering! You will be contacted with further details.",
      });

      // Reset form
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
        accommodationType: "",
        dietaryRequirements: "",
        accommodationNeeds: "",
        dailyMeals: [],
        certificateName: "",
        codeOfConductConfirm: "",
        travelRequirementsConfirm: "",
      });
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading event details..." />;
  }

  if (!event) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
            <p className="text-gray-600">The event you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const handleShare = async () => {
    const publicUrl = `${window.location.origin}/public/event-registration/${eventId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${event?.title} - Registration Form`,
          url: publicUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(publicUrl);
      toast({
        title: "Link Copied",
        description: "Public registration form link copied to clipboard",
      });
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Event Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-xl sm:text-2xl text-center sm:text-left">
                  {event.registration_form_title || `${event.title} - Registration Form`}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center gap-2 self-center sm:self-auto"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
              <div className="text-center sm:text-left text-gray-600 space-y-2">
                <p className="text-sm">The survey will take approximately 8 minutes to complete.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-6 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>DETAILS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">1. First Name / Prénom *</Label>
                  <p className="text-xs text-gray-500 mb-2">as stated in passport</p>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">2. Last Name / Nom de famille *</Label>
                  <p className="text-xs text-gray-500 mb-2">as stated in passport</p>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>3. What is your OC? *</Label>
                <RadioGroup value={formData.oc} onValueChange={(value) => handleInputChange('oc', value)}>
                  {['OCA', 'OCB', 'OCBA', 'OCG', 'OCP', 'WACA'].map((oc) => (
                    <div key={oc} className="flex items-center space-x-2">
                      <RadioGroupItem value={oc} id={oc} />
                      <Label htmlFor={oc}>{oc}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>4. Are you on contract or in between contracts? *</Label>
                <RadioGroup value={formData.contractStatus} onValueChange={(value) => handleInputChange('contractStatus', value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="On contract" id="on-contract" />
                    <Label htmlFor="on-contract">On contract</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Between contracts" id="between-contracts" />
                    <Label htmlFor="between-contracts">Between contracts</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>5. Type of Contract *</Label>
                <p className="text-xs text-gray-500 mb-2">
                  HQ = Headquarters Contract<br/>
                  IMS = International Mobile Staff Contract<br/>
                  LRS = Locally Recruited Staff Contract
                </p>
                <RadioGroup value={formData.contractType} onValueChange={(value) => handleInputChange('contractType', value)}>
                  {['HQ', 'IMS', 'LRS', 'Other'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <RadioGroupItem value={type} id={type} />
                      <Label htmlFor={type}>{type}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>6. Gender Identity *</Label>
                <RadioGroup value={formData.genderIdentity} onValueChange={(value) => handleInputChange('genderIdentity', value)}>
                  {['Man', 'Woman', 'Non-binary', 'Prefer to self-describe', 'Prefer not to disclose'].map((gender) => (
                    <div key={gender} className="flex items-center space-x-2">
                      <RadioGroupItem value={gender} id={gender} />
                      <Label htmlFor={gender}>{gender}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>7. Sex *</Label>
                <p className="text-xs text-gray-500 mb-2">As indicated in your passport. If you do not identify with the sex written in your passport, please email us.</p>
                <RadioGroup value={formData.sex} onValueChange={(value) => handleInputChange('sex', value)}>
                  {['Female', 'Male', 'Other'].map((sex) => (
                    <div key={sex} className="flex items-center space-x-2">
                      <RadioGroupItem value={sex} id={sex} />
                      <Label htmlFor={sex}>{sex}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>8. Pronouns *</Label>
                <RadioGroup value={formData.pronouns} onValueChange={(value) => handleInputChange('pronouns', value)}>
                  {['He / him', 'She / her', 'They / Them', 'Other'].map((pronoun) => (
                    <div key={pronoun} className="flex items-center space-x-2">
                      <RadioGroupItem value={pronoun} id={pronoun} />
                      <Label htmlFor={pronoun}>{pronoun}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="currentPosition">9. Current (or most recent) position *</Label>
                <Input
                  id="currentPosition"
                  value={formData.currentPosition}
                  onChange={(e) => handleInputChange('currentPosition', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="countryOfWork">10. Country of work</Label>
                <p className="text-xs text-gray-500 mb-2">In which country of assignment do you work?<br/>If you are in-between country programs please leave this blank</p>
                <Input
                  id="countryOfWork"
                  value={formData.countryOfWork}
                  onChange={(e) => handleInputChange('countryOfWork', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="projectOfWork">11. Project of work</Label>
                <p className="text-xs text-gray-500 mb-2">In which country project do you work?<br/>If you are country programs please leave this blank</p>
                <Input
                  id="projectOfWork"
                  value={formData.projectOfWork}
                  onChange={(e) => handleInputChange('projectOfWork', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="personalEmail">12. Personal/Tembo E-mail Address *</Label>
                <p className="text-xs text-gray-500 mb-2">
                  If you are currently enrolled on Tembo with an email address, please use that same email address here.<br/><br/>
                  This email address will be used for all communication regarding this course<br/><br/>
                  Please make extra sure that the address is written correctly.<br/><br/>
                  If you are adding more than one address, please separate them with ;
                </p>
                <Input
                  id="personalEmail"
                  type="email"
                  value={formData.personalEmail}
                  onChange={(e) => handleInputChange('personalEmail', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="msfEmail">13. MSF Email</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Please make extra sure that the address is written correctly.<br/><br/>
                  If you are adding more than one address, please separate them with ;
                </p>
                <Input
                  id="msfEmail"
                  type="email"
                  value={formData.msfEmail}
                  onChange={(e) => handleInputChange('msfEmail', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="hrcoEmail">14. HRCo Email</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Please make extra sure that the address is written correctly.<br/><br/>
                  If you are adding more than one address, please separate them with ;
                </p>
                <Input
                  id="hrcoEmail"
                  type="email"
                  value={formData.hrcoEmail}
                  onChange={(e) => handleInputChange('hrcoEmail', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="careerManagerEmail">15. Career Manager Email</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Please make extra sure that the address is written correctly.<br/><br/>
                  If you are adding more than one address, please separate them with ;
                </p>
                <Input
                  id="careerManagerEmail"
                  type="email"
                  value={formData.careerManagerEmail}
                  onChange={(e) => handleInputChange('careerManagerEmail', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="lineManagerEmail">17. Line Manager Email</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Please make extra sure that the address is written correctly. If you are not OCA please add the email of your hosting OC.<br/><br/>
                  If you are adding more than one address, please separate them with ;
                </p>
                <Input
                  id="lineManagerEmail"
                  type="email"
                  value={formData.lineManagerEmail}
                  onChange={(e) => handleInputChange('lineManagerEmail', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber">18. Phone number *</Label>
                <p className="text-xs text-gray-500 mb-2">
                  This will only be used for emergencies or in order to coordinate transportation, if relevant<br/><br/>
                  Please make extra sure that the number is written correctly.<br/><br/>
                  Please include the calling code, including 00<br/><br/>
                  e.g. 00 30 123456789
                </p>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  required
                />
              </div>

              {/* Page 2 - Travel Details */}
              <div className="lg:col-span-2">
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-2">TRAVEL, PASSPORT, AND VISA DETAILS</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Kindly, make sure this section is completed correctly. If completed incorrectly it may result in your visa documents taking longer.<br/><br/>
                    Please, double-check each section is completed accordingly and as stated in your passport.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-2">
                <Label>19. Will you be travelling internationally for this training? *</Label>
                <RadioGroup value={formData.travellingInternationally} onValueChange={(value) => handleInputChange('travellingInternationally', value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="travel-yes" />
                    <Label htmlFor="travel-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="travel-no" />
                    <Label htmlFor="travel-no">No</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Page 3 - Accommodation */}
              <div className="lg:col-span-2">
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-2">ACCOMMODATION REQUESTS</h3>
                </div>
              </div>

              <div className="lg:col-span-2">
                <Label>20. Will you be staying at the MSF OCA-provided accommodation overnight during the training dates, or will you be travelling to and from the training venue every day and staying elsewhere overnight? *</Label>
                <p className="text-xs text-gray-500 mb-2">
                  Please note that OCA provides free accommodation for all participants. If you would not like to accept the offer of accommodation, here is where you can indicate this to us.
                </p>
                <RadioGroup value={formData.accommodationType} onValueChange={(value) => handleInputChange('accommodationType', value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Staying at MSF accommodation" id="staying" />
                    <Label htmlFor="staying">Staying at the MSF OCA accommodation overnight</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Travelling daily" id="travelling" />
                    <Label htmlFor="travelling">Travelling to and from the venue daily and staying somewhere else</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Conditional fields based on accommodation type */}
              {formData.accommodationType === 'Staying at MSF accommodation' && (
                <>
                  <div>
                    <Label htmlFor="dietaryRequirements">21. Dietary Requirements</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Do you have any dietary requirements, INCLUDING religious and/or cultural (such as Halal / no pork / etc.)?
                    </p>
                    <Input
                      id="dietaryRequirements"
                      value={formData.dietaryRequirements}
                      onChange={(e) => handleInputChange('dietaryRequirements', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="accommodationNeeds">22. Accommodation needs or requirements</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Do you have any accommodation needs or requirements that we / the organisation section should be aware of?<br/><br/>
                      Please note that we cannot book single rooms for staff. For most trainings, staff will share a room with one other person. If you are concerned that you snore loudly, please consider bringing earplugs for your roommate.
                    </p>
                    <Input
                      id="accommodationNeeds"
                      value={formData.accommodationNeeds}
                      onChange={(e) => handleInputChange('accommodationNeeds', e.target.value)}
                    />
                  </div>
                </>
              )}

              {formData.accommodationType === 'Travelling daily' && (
                <>
                  <div className="lg:col-span-2">
                    <Label>21. When you visit during the day, which meals would you like to have at the venue daily? *</Label>
                    <div className="space-y-2 mt-2">
                      {['Breakfast', 'Lunch', 'Dinner', 'Other'].map((meal) => (
                        <div key={meal} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={meal}
                            checked={formData.dailyMeals.includes(meal)}
                            onChange={(e) => handleMealChange(meal, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={meal}>{meal}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="dietaryRequirements">Dietary Requirements</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Do you have any dietary requirements, INCLUDING religious and/or cultural (such as Halal / no pork / etc.)?
                    </p>
                    <Input
                      id="dietaryRequirements"
                      value={formData.dietaryRequirements}
                      onChange={(e) => handleInputChange('dietaryRequirements', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="accommodationNeeds">Accommodation needs or requirements</Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Do you have any accommodation needs or requirements that we / the organisation section should be aware of?<br/><br/>
                      Please note that we cannot book single rooms for staff. For most trainings, staff will share a room with one other person. If you are concerned that you snore loudly, please consider bringing earplugs for your roommate.
                    </p>
                    <Input
                      id="accommodationNeeds"
                      value={formData.accommodationNeeds}
                      onChange={(e) => handleInputChange('accommodationNeeds', e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Section 4 - Certificate */}
              <div className="lg:col-span-2">
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-2">CERTIFICATE</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Some courses award certificates to participants who successfully complete all necessary elements. If you are awarded a certificate at the end of this course, we want to know exactly how you would like your name printed on your certificate. Below, please write exactly how you would like your name to appear on your certificate, including the order, any titles (if relevant), and the appropriate case (capitals / lower case / etc.).
                  </p>
                </div>
              </div>

              <div className="lg:col-span-2">
                <Label htmlFor="certificateName">23. Certificate name</Label>
                <Input
                  id="certificateName"
                  value={formData.certificateName}
                  onChange={(e) => handleInputChange('certificateName', e.target.value)}
                  placeholder="Enter exactly how you want your name to appear on the certificate"
                />
              </div>

              {/* Section 5 - MSF Code of Conduct */}
              <div className="lg:col-span-2">
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-2">MSF CODE OF CONDUCT</h3>
                </div>
              </div>

              <div className="lg:col-span-2">
                <Label>24. I confirm that I have read the MSF code of conduct linked to my work contract. I affirm my commitment to abide by the code of conduct. I understand that the code of conduct applies in full during this training. *</Label>
                <RadioGroup value={formData.codeOfConductConfirm} onValueChange={(value) => handleInputChange('codeOfConductConfirm', value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="conduct-yes" />
                    <Label htmlFor="conduct-yes">Yes</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Section 6 - To Note */}
              <div className="lg:col-span-2">
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold mb-2">TO NOTE</h3>
                  <div className="text-sm text-gray-600 mb-4 space-y-2">
                    <p>It is the responsibility of the applicant and the country program/person recommending them to inquire about the vaccination and travel requirement to enter the country in which the course is hosted.</p>
                    <p>It is the responsibility of the applicant and the country program/person recommending them to inquire about the rules to re-enter your home country/country in which you currently work (country program)</p>
                    <p>If you are currently in country program, HRCOs are responsible for booking travel/flights. You should provide travel details to <a href="mailto:amsterdam.developmentofficer@amsterdam.msf.org" className="text-blue-600 underline">amsterdam.developmentofficer@amsterdam.msf.org</a> as soon as they are confirmed so that we can issue the documents you will require for your VISA application.</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <Label>25. I confirm I have read the reminder above *</Label>
                <RadioGroup value={formData.travelRequirementsConfirm} onValueChange={(value) => handleInputChange('travelRequirementsConfirm', value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="travel-confirm-yes" />
                    <Label htmlFor="travel-confirm-yes">Yes</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="lg:col-span-2 flex flex-col sm:flex-row gap-3 justify-between pt-6">
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/tenant/${tenantSlug}/events`)}
                  className="w-full sm:w-auto"
                >
                  Back to Events
                </Button>
                <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Registration'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}