import { useState, useEffect } from 'react';
import {
  Shield,
  FileCheck,
  Clock,
  XCircle,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Lock,
  RefreshCw,
  ExternalLink,
  Info,
  Check,
  UserCheck,
} from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type VerificationStatus =
  | 'not_verified'
  | 'pending'
  | 'verified'
  | 'failed'
  | 'requires_review';

interface VerificationRecord {
  id: string;
  document_type: string;
  document_number_masked: string;
  status: VerificationStatus;
  risk_level: string;
  failure_reason?: string | null;
  provider_status: string;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

const DOC_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card (12 Digits)', hint: 'e.g. 1234 5678 9010 (Verhoeff checksum verified)' },
  { value: 'pan', label: 'PAN Card (Permanent Account Number)', hint: 'e.g. ABCDE1234F (10 uppercase characters)' },
  { value: 'driving_licence', label: 'Driving Licence', hint: 'e.g. DL-1420110012345' },
  { value: 'skill_certificate', label: 'Trade / Skill Certification', hint: 'Government or vocational training certificate' },
  { value: 'police_clearance', label: 'Police Clearance Certificate', hint: 'Local police verification certificate' },
];

const STATUS_DETAILS: Record<
  VerificationStatus,
  { label: string; icon: React.ElementType; color: string; badgeClass: string; desc: string }
> = {
  not_verified: {
    label: 'Not Verified',
    icon: AlertTriangle,
    color: 'text-muted-foreground',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    desc: 'You have not submitted official identity credentials yet.',
  },
  pending: {
    label: 'Verification Pending',
    icon: Clock,
    color: 'text-amber-500',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    desc: 'Your credentials have been submitted and are undergoing compliance checks.',
  },
  verified: {
    label: 'Verified',
    icon: CheckCircle2,
    color: 'text-green-600',
    badgeClass: 'bg-green-600/10 text-green-600 border-green-600/30',
    desc: 'Your identity is officially confirmed. Verified Pro badge is active on your profile.',
  },
  failed: {
    label: 'Verification Failed',
    icon: XCircle,
    color: 'text-destructive',
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/30',
    desc: 'The submitted document failed format or checksum validation.',
  },
  requires_review: {
    label: 'Verification Requires Review',
    icon: AlertTriangle,
    color: 'text-amber-500',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    desc: 'Document requires administrative manual review. Our compliance team is inspecting it.',
  },
};

export default function WorkerVerification() {
  const { user, profile } = useAuth();
  const [docType, setDocType] = useState('aadhaar');
  const [docNumber, setDocNumber] = useState('');
  const [holderName, setHolderName] = useState(profile?.full_name || '');
  const [submitting, setSubmitting] = useState(false);
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallStatus, setOverallStatus] = useState<VerificationStatus>('not_verified');
  const [showForm, setShowForm] = useState(true);

  const fetchStatus = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/verification/status/${user.id}`);
      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        setRecords(data.documents || []);
        setOverallStatus(data.status || 'not_verified');

        // Sync verified badge to Supabase profile if backend confirmed verification
        if (data.is_verified && !profile?.is_verified) {
          await supabase
            .from('profiles')
            .update({ is_verified: true })
            .eq('user_id', user.id);
        }
      }
    } catch {
      // Quiet fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to submit verification credentials.');
      return;
    }
    if (!docNumber.trim()) {
      toast.error('Please enter your document credential number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          user_name: holderName.trim() || user.email?.split('@')[0] || 'Worker',
          role: 'worker',
          document_type: docType,
          document_number: docNumber.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.detail || 'Verification validation failed.');
      }

      const val = json.validation_details;
      if (val.status === 'verified') {
        toast.success('Identity Verified Successfully! Verified Badge granted.');
        // Update profile in supabase
        await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('user_id', user.id);
      } else if (val.status === 'requires_review') {
        toast.info('Document submitted for administrative compliance review.');
      } else if (val.status === 'failed') {
        toast.error(`Verification Failed: ${val.reason || 'Invalid credential details.'}`);
      }

      setDocNumber('');
      await fetchStatus();
    } catch (err: any) {
      toast.error(err.message || 'Verification submission error.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusCfg = STATUS_DETAILS[overallStatus] || STATUS_DETAILS.not_verified;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="Identity & Skill Verification" showBack />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Verification Overview Banner */}
        <Card className="p-5 border-primary/20 bg-gradient-to-br from-card to-primary/5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center bg-primary/10 ${statusCfg.color}`}>
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                  {statusCfg.label}
                  {overallStatus === 'verified' && (
                    <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                      PRO BADGE ACTIVE
                    </Badge>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {statusCfg.desc}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={statusCfg.badgeClass}>
              {statusCfg.label}
            </Badge>
          </div>

          {/* Privacy & Compliance Assurance */}
          <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground space-y-1">
            <p className="flex items-center gap-1 font-semibold text-foreground">
              <Lock className="h-3 w-3 text-primary" />
              Privacy & Fraud Prevention Standards:
            </p>
            <p>
              • Sensitive document numbers are securely masked (e.g. <code>XXXX-XXXX-1234</code>) and never exposed publicly.
            </p>
            <p>
              • Phone or email verification alone does not grant a verified badge. Official government identity credentials are required.
            </p>
            <p className="text-[10px] text-muted-foreground/70 italic">
              • Compliance Provider: NearWork Verification Pipeline (Live UIDAI / NSDL gateway key pending in environment).
            </p>
          </div>
        </Card>

        {/* Verification Form */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary" />
                Submit Verification Credentials
              </h4>
              <p className="text-xs text-muted-foreground">
                Enter your genuine identity or trade credential for compliance verification.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Document Type Selector */}
            <div className="space-y-1.5">
              <Label className="font-bold text-xs">Document Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((d) => (
                    <SelectItem key={d.value} value={d.value} className="text-xs">
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {DOC_TYPES.find((d) => d.value === docType)?.hint}
              </p>
            </div>

            {/* Document Number */}
            <div className="space-y-1.5">
              <Label className="font-bold text-xs">Document ID / Number</Label>
              <Input
                placeholder={
                  docType === 'aadhaar'
                    ? '12-digit Aadhaar (e.g. 123456789010)'
                    : docType === 'pan'
                    ? '10-character PAN (e.g. ABCDE1234F)'
                    : 'Enter credential number'
                }
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value.toUpperCase())}
                className="h-11 rounded-xl uppercase font-mono text-xs tracking-wider"
                required
              />
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Input is verified using standard checksums and duplicate prevention algorithms.
              </p>
            </div>

            {/* Full Name as per document */}
            <div className="space-y-1.5">
              <Label className="font-bold text-xs">Full Name as per Document</Label>
              <Input
                placeholder="Full name matching your ID card"
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                className="h-11 rounded-xl text-xs"
                required
              />
            </div>

            {/* Submit CTA */}
            <Button
              type="submit"
              disabled={submitting || !docNumber.trim()}
              className="w-full h-12 rounded-xl font-bold gap-2 text-sm shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying Credentials with Provider...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  Submit for Official Verification
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Submitted Document History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-foreground">
              Submitted Verification Records ({records.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStatus}
              className="h-7 text-xs text-muted-foreground gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : records.length === 0 ? (
            <Card className="p-6 text-center text-xs text-muted-foreground border-dashed">
              No verification records submitted yet. Complete the form above to verify your account.
            </Card>
          ) : (
            records.map((rec) => {
              const cfg = STATUS_DETAILS[rec.status] || STATUS_DETAILS.not_verified;
              const RecIcon = cfg.icon;
              const docLabel =
                DOC_TYPES.find((d) => d.value === rec.document_type)?.label || rec.document_type;

              return (
                <Card key={rec.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-extrabold text-sm text-foreground">{docLabel}</p>
                      <p className="font-mono text-xs text-muted-foreground mt-0.5">
                        {rec.document_number_masked}
                      </p>
                    </div>
                    <Badge variant="outline" className={cfg.badgeClass}>
                      <RecIcon className="h-3 w-3 mr-1" />
                      {cfg.label}
                    </Badge>
                  </div>

                  {rec.failure_reason && (
                    <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                      <strong>Reason: </strong> {rec.failure_reason}
                    </div>
                  )}

                  {rec.admin_notes && (
                    <p className="text-[11px] text-muted-foreground italic">
                      Compliance Note: {rec.admin_notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                    <span>Submitted: {new Date(rec.created_at).toLocaleDateString('en-IN')}</span>
                    <span className="capitalize">Risk: {rec.risk_level}</span>
                  </div>

                  {/* Retry / Appeal option for failed verification */}
                  {rec.status === 'failed' && (
                    <div className="pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs font-bold gap-1.5 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setDocType(rec.document_type);
                          setDocNumber('');
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry Verification / Re-enter Credential
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
