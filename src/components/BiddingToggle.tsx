import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users, CheckCircle2, ShieldCheck } from 'lucide-react';

interface BiddingToggleProps {
  allowBidding: boolean;
  onToggle: (val: boolean) => void;
}

export default function BiddingToggle({ allowBidding, onToggle }: BiddingToggleProps) {
  return (
    <Card className="p-4 border-primary/25 bg-gradient-to-br from-card to-primary/5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-sm text-foreground">
              Allow Workers to Bid
            </h4>
            <Badge
              variant={allowBidding ? 'default' : 'secondary'}
              className="text-[11px] font-bold uppercase tracking-wider"
            >
              {allowBidding ? 'ON (Competitive Bidding)' : 'OFF (Direct AI Recommendations)'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {allowBidding
              ? 'Workers submit custom bids for you to compare and choose.'
              : 'NearWork AI directly evaluates and recommends the top suitable workers.'}
          </p>
        </div>
        <Switch
          checked={allowBidding}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-primary ml-3"
        />
      </div>

      <div className="rounded-lg p-2.5 bg-background/80 border border-border/60 text-xs space-y-1.5">
        {allowBidding ? (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span>How Bidding ON works:</span>
            </div>
            <ul className="text-muted-foreground text-[11px] space-y-0.5 list-disc pl-4">
              <li>Multiple local pros submit price quotes and timelines.</li>
              <li>Compare ratings, completed jobs, reviews, and identity verification.</li>
              <li>You choose and accept your preferred worker whenever you're ready.</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>How Bidding OFF works:</span>
            </div>
            <ul className="text-muted-foreground text-[11px] space-y-0.5 list-disc pl-4">
              <li>Open bidding is disabled for this job.</li>
              <li>AI instantly ranks local workers by category skills, distance, verified badges, and ratings.</li>
              <li>Review the ranked profiles and click <strong>Select & Assign</strong> directly.</li>
            </ul>
            <p className="text-[10px] text-muted-foreground/80 italic pt-0.5">
              * Recommendations are algorithmic suggestions based on qualifications, not a guarantee of service quality.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
