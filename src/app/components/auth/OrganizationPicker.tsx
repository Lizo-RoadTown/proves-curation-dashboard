/**
 * OrganizationPicker - First login organization selection
 *
 * Shows on first login to let users pick their primary organization.
 * In sandbox mode, users are admin of all orgs but still need to pick
 * which one is their "primary" (home) organization.
 */

import { useState, useEffect } from "react";
import { Loader2, Building2, Check } from "lucide-react";
import { supabase } from "../../../lib/supabase";

interface Organization {
  org_id: string;
  org_name: string;
  org_slug: string;
  org_color: string;
}

interface OrganizationPickerProps {
  userId: string;
  onComplete: (selectedOrgId: string) => void;
}

export function OrganizationPicker({ userId, onComplete }: OrganizationPickerProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all organizations the user belongs to
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const { data, error } = await supabase.rpc('get_user_organizations', {
          p_user_id: userId
        });

        if (error) throw error;

        setOrganizations(data || []);
        // Pre-select Cal Poly Pomona if it exists
        const cpp = data?.find((o: Organization) => o.org_slug === 'cal-poly-pomona');
        if (cpp) {
          setSelectedOrgId(cpp.org_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load organizations');
      } finally {
        setLoading(false);
      }
    }

    fetchOrganizations();
  }, [userId]);

  const handleSelect = async () => {
    if (!selectedOrgId) return;

    try {
      setSaving(true);

      // Call the activate_organization RPC (validates membership and sets active org)
      const { data, error } = await supabase.rpc('activate_organization', {
        p_org_id: selectedOrgId
      });

      if (error) throw error;

      if (data && !data.success) {
        throw new Error(data.error || 'Failed to activate organization');
      }

      console.log('[OrganizationPicker] Activated org:', data);

      // Store in localStorage that user has completed setup
      localStorage.setItem('proves_org_selected', 'true');

      onComplete(selectedOrgId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save selection');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#06b6d4]" />
          <p className="text-sm text-[#64748b]">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1e293b] border border-[#334155] rounded-lg p-6">
        <div className="text-center mb-6">
          <Building2 className="h-12 w-12 text-[#06b6d4] mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-[#e2e8f0]">
            Select Your Organization
          </h1>
          <p className="text-sm text-[#94a3b8] mt-2">
            Choose your primary university or team. You can switch between
            organizations anytime from the header.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-2 mb-6">
          {organizations.map((org) => (
            <button
              key={org.org_id}
              onClick={() => setSelectedOrgId(org.org_id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                selectedOrgId === org.org_id
                  ? "bg-[#06b6d4]/10 border-[#06b6d4] text-[#e2e8f0]"
                  : "bg-[#0f172a] border-[#334155] text-[#94a3b8] hover:border-[#475569] hover:text-[#e2e8f0]"
              }`}
            >
              <span
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: org.org_color }}
              />
              <span className="flex-1 text-left text-sm font-medium">
                {org.org_name}
              </span>
              {selectedOrgId === org.org_id && (
                <Check className="w-5 h-5 text-[#06b6d4]" />
              )}
            </button>
          ))}
        </div>

        {organizations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[#64748b] text-sm">
              No organizations available. Please contact an administrator.
            </p>
          </div>
        )}

        <button
          onClick={handleSelect}
          disabled={!selectedOrgId || saving}
          className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            selectedOrgId && !saving
              ? "bg-[#06b6d4] text-[#0f172a] hover:bg-[#22d3ee]"
              : "bg-[#334155] text-[#64748b] cursor-not-allowed"
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Continue</span>
          )}
        </button>

        <p className="text-xs text-[#64748b] text-center mt-4">
          You have access to all {organizations.length} organizations. Your
          selection sets your default view.
        </p>
      </div>
    </div>
  );
}
