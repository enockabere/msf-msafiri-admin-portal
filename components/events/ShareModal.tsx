import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailTemplateEditor } from "@/components/ui/email-template-editor";
import { Loader2, Mail, Copy } from "lucide-react";
import { toast as sonnerToast } from "sonner";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publicUrl: string;
  event: any;
  tenant: any;
  apiClient: any;
  eventId: string;
}

export default function ShareModal({
  open,
  onOpenChange,
  publicUrl,
  event,
  tenant,
  apiClient,
  eventId,
}: ShareModalProps) {
  const [emailSubject, setEmailSubject] = useState(`Registration: ${event?.title}`);
  const [emailBody, setEmailBody] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [ccEmails, setCcEmails] = useState("");
  const [bccEmails, setBccEmails] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    sonnerToast.success("Link Copied", {
      description: "Registration form link copied to clipboard",
    });
  };

  const handleEmailShare = async () => {
    const subject = emailSubject || `Registration: ${event?.title}`;
    
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
      await apiClient.request('/notifications/send-registration-email', {
        method: 'POST',
        body: JSON.stringify({
          to_email: toEmails[0],
          cc_emails: [...toEmails.slice(1), ...ccEmailsList],
          bcc_emails: bccEmailsList,
          subject: subject.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, ''),
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
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col bg-white p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">Share Application Form</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg border">
            <p className="text-sm font-medium text-gray-700 mb-2">Registration Link</p>
            <p className="text-xs text-gray-600 break-all font-mono bg-white p-2 rounded border">
              {publicUrl}
            </p>
          </div>

          <Button onClick={handleCopyLink} className="w-full bg-red-600 hover:bg-red-700 text-white h-10">
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>

          <div className="border-t pt-4 space-y-3">
            <div>
              <Label htmlFor="recipientEmail" className="text-sm font-medium text-gray-700">
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
              <Label htmlFor="ccEmails" className="text-sm font-medium text-gray-700">
                CC (Optional)
              </Label>
              <Input
                id="ccEmails"
                value={ccEmails}
                onChange={(e) => setCcEmails(e.target.value)}
                placeholder="cc1@example.com, cc2@example.com"
                className="mt-1.5 h-10 border-gray-300 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="bccEmails" className="text-sm font-medium text-gray-700">
                BCC (Optional)
              </Label>
              <Input
                id="bccEmails"
                value={bccEmails}
                onChange={(e) => setBccEmails(e.target.value)}
                placeholder="bcc1@example.com, bcc2@example.com"
                className="mt-1.5 h-10 border-gray-300 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="emailSubject" className="text-sm font-medium text-gray-700">
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

        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-10">
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
  );
}