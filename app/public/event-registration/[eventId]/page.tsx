"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, MapPin } from "lucide-react";
import { toast } from "@/components/ui/toast";

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
  ldManagerEmail: string;
  lineManagerEmail: string;
  phoneNumber: string;
}

export default function PublicEventRegistrationPage() {
  const params = useParams();
  const eventId = params.eventId as string;
  
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
    ldManagerEmail: "",
    lineManagerEmail: "",
    phoneNumber: "",
  });

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/v1/events/${eventId}/public`);
      if (!response.ok) {
        throw new Error("Event not found");
      }
      const eventData = await response.json();
      setEvent(eventData);
    } catch (error) {
      console.error("Error fetching event:", error);
      toast({
        title: "Error",
        description: "Event not found or not available for registration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = [
      'firstName', 'lastName', 'oc', 'contractStatus', 'contractType',
      'genderIdentity', 'sex', 'pronouns', 'currentPosition', 'personalEmail',
      'msfEmail', 'phoneNumber'
    ];
    
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
      const response = await fetch(`/api/v1/events/${eventId}/public-register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          eventId: parseInt(eventId),
        }),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

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
        ldManagerEmail: "",
        lineManagerEmail: "",
        phoneNumber: "",
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600">The event you're looking for is not available for registration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {event.registration_form_title || `${event.title} - Registration Form`}
            </CardTitle>
            <div className="text-center text-gray-600 space-y-2">
              <p className="text-sm">The survey will take approximately 8 minutes to complete.</p>
              <div className="flex items-center justify-center gap-6 text-sm">
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
          <CardContent>
            <div className="prose max-w-none text-sm">
              {event.registration_form_description && (
                <div dangerouslySetInnerHTML={{ __html: event.registration_form_description }} />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DETAILS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name / Prénom *</Label>
                <p className="text-xs text-gray-500 mb-2">as stated in passport</p>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name / Nom de famille *</Label>
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
              <Label>What is your OC? *</Label>
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
              <Label>Are you on contract or in between contracts? *</Label>
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
              <Label>Type of Contract *</Label>
              <p className="text-xs text-gray-500 mb-2">
                HQ = Headquarters Contract, IMS = International Mobile Staff Contract, LRS = Locally Recruited Staff Contract
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
              <Label>Gender Identity *</Label>
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
              <Label>Sex *</Label>
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
              <Label>Pronouns *</Label>
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
              <Label htmlFor="currentPosition">Current (or most recent) position *</Label>
              <Input
                id="currentPosition"
                value={formData.currentPosition}
                onChange={(e) => handleInputChange('currentPosition', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="countryOfWork">Country of work</Label>
              <p className="text-xs text-gray-500 mb-2">In which country of assignment do you work? If you are in-between country programs please leave this blank</p>
              <Input
                id="countryOfWork"
                value={formData.countryOfWork}
                onChange={(e) => handleInputChange('countryOfWork', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="projectOfWork">Project of work</Label>
              <p className="text-xs text-gray-500 mb-2">In which country project do you work? If you are country programs please leave this blank</p>
              <Input
                id="projectOfWork"
                value={formData.projectOfWork}
                onChange={(e) => handleInputChange('projectOfWork', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="personalEmail">Personal/Tembo E-mail Address *</Label>
              <p className="text-xs text-gray-500 mb-2">
                If you are currently enrolled on Tembo with an email address, please use that same email address here.
                This email address will be used for all communication regarding this course.
                Please make extra sure that the address is written correctly.
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
              <Label htmlFor="msfEmail">MSF Email *</Label>
              <p className="text-xs text-gray-500 mb-2">
                Please make extra sure that the address is written correctly.
                If you are adding more than one address, please separate them with ;
              </p>
              <Input
                id="msfEmail"
                type="email"
                value={formData.msfEmail}
                onChange={(e) => handleInputChange('msfEmail', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="hrcoEmail">HRCo Email</Label>
              <p className="text-xs text-gray-500 mb-2">
                Please make extra sure that the address is written correctly.
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
              <Label htmlFor="careerManagerEmail">Career Manager Email</Label>
              <p className="text-xs text-gray-500 mb-2">
                Please make extra sure that the address is written correctly.
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
              <Label htmlFor="ldManagerEmail">L&D Manager Email</Label>
              <p className="text-xs text-gray-500 mb-2">
                Please make extra sure that the address is written correctly. If you are not OCA please add the email of your hosting OC.
                If you are adding more than one address, please separate them with ;
              </p>
              <Input
                id="ldManagerEmail"
                type="email"
                value={formData.ldManagerEmail}
                onChange={(e) => handleInputChange('ldManagerEmail', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="lineManagerEmail">Line Manager Email</Label>
              <p className="text-xs text-gray-500 mb-2">
                Please make extra sure that the address is written correctly. If you are not OCA please add the email of your hosting OC.
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
              <Label htmlFor="phoneNumber">Phone number *</Label>
              <p className="text-xs text-gray-500 mb-2">
                This will only be used for emergencies or in order to coordinate transportation, if relevant.
                Please make extra sure that the number is written correctly.
                Please include the calling code, including 00
                e.g. 00 30 123456789
              </p>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end pt-6">
              <Button onClick={handleSubmit} disabled={submitting}>
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
    </div>
  );
}