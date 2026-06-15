'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Shield,
  RefreshCw,
  Phone,
  Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { WhatsAppConfig as WhatsAppConfigType } from '@/types';

export function WhatsAppConfig() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [config, setConfig] = useState<WhatsAppConfigType | null>(null);
  const [phoneInfo, setPhoneInfo] = useState<{ display_phone_number?: string; verified_name?: string; quality_rating?: string; code_verification_status?: string } | null>(null);
  const [oauthResult, setOauthResult] = useState<{ success?: boolean; needsVerification?: boolean; error?: string } | null>(null);

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/whatsapp/webhook`
      : '';

  const fetchConfig = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Failed to load config:', error);
        return;
      }

      setConfig(data as WhatsAppConfigType | null);

      if (data?.status === 'connected' && data?.phone_number_id) {
        const res = await fetch('/api/whatsapp/config');
        if (res.ok) {
          const result = await res.json();
          setPhoneInfo(result.phone_info ?? null);
        }
      }
    } catch (err) {
      console.error('Error fetching config:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }

    const params = new URLSearchParams(window.location.search);
    const oauth = params.get('oauth');
    const needsVerification = params.get('needs_verification') === '1';
    const errorReason = params.get('reason');

    if (oauth === 'success') {
      setOauthResult({ success: true, needsVerification });
      toast.success('WhatsApp connected successfully!');
      window.history.replaceState({}, '', '/settings?tab=whatsapp');
    } else if (oauth === 'error') {
      setOauthResult({ error: errorReason || 'Unknown error' });
      toast.error('Failed to connect WhatsApp');
      window.history.replaceState({}, '', '/settings?tab=whatsapp');
    }

    fetchConfig(user.id);
  }, [user, authLoading, fetchConfig]);

  const handleConnect = () => {
    window.location.href = '/api/whatsapp/oauth/init';
  };

  const handleDisconnect = async () => {
    if (!user) return;
    setDisconnecting(true);
    try {
      const res = await fetch('/api/whatsapp/config', { method: 'DELETE' });
      if (res.ok) {
        setConfig(null);
        setPhoneInfo(null);
        toast.success('WhatsApp disconnected');
      } else {
        toast.error('Failed to disconnect');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;
    setCheckingStatus(true);
    try {
      const res = await fetch('/api/whatsapp/config');
      if (res.ok) {
        const data = await res.json();
        setPhoneInfo(data.phone_info ?? null);
        if (data.phone_info?.code_verification_status === 'VERIFIED') {
          toast.success('Phone number is verified!');
          const { error } = await supabase
            .from('whatsapp_config')
            .update({ code_verification_status: 'VERIFIED' })
            .eq('user_id', user.id);
          if (!error) fetchConfig(user.id);
        } else {
          toast.info('Phone number is not yet verified. Complete verification in Meta Business Manager first.');
        }
      }
    } catch {
      toast.error('Failed to check verification status');
    } finally {
      setCheckingStatus(false);
    }
  };

  if (loading || authLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = config?.status === 'connected';
  const isVerified = phoneInfo?.code_verification_status === 'VERIFIED' || config?.code_verification_status === 'VERIFIED';
  const needsVerification = isConnected && !isVerified;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      {!isConnected ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Connect WhatsApp
            </CardTitle>
            <CardDescription>
              Link your WhatsApp Business account with a single click. No Meta Developer dashboard needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleConnect} size="lg" className="w-full sm:w-auto">
              <ExternalLink className="mr-2 h-4 w-4" />
              Connect WhatsApp
            </Button>

            {oauthResult?.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Connection Failed</AlertTitle>
                <AlertDescription>{oauthResult.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Connected Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                WhatsApp Connected
              </CardTitle>
              <CardDescription>
                Your WhatsApp Business account is linked and ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-semibold">{config?.phone_number || phoneInfo?.display_phone_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Business Name</p>
                  <p className="font-semibold">{config?.business_name || phoneInfo?.verified_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verification Status</p>
                  <p className="font-semibold flex items-center gap-1">
                    {isVerified ? (
                      <><CheckCircle2 className="h-4 w-4 text-green-500" /> Verified</>
                    ) : (
                      <><AlertTriangle className="h-4 w-4 text-amber-500" /> Not Verified</>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quality Rating</p>
                  <p className="font-semibold">{phoneInfo?.quality_rating || config?.quality_rating || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Coexistence Mode</p>
                  <p className="font-semibold">{config?.coexistence_mode ? 'Active (India)' : 'Disabled'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Connected Since</p>
                  <p className="font-semibold">{config?.connected_at ? new Date(config.connected_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => fetchConfig(user?.id || '')}>
                  <RefreshCw className="mr-2 h-3 w-3" /> Refresh
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDisconnect} disabled={disconnecting}>
                  {disconnecting ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Trash2 className="mr-2 h-3 w-3" />}
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Phone Verification Card */}
          {needsVerification && (
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Shield className="h-5 w-5" />
                  Verify Your Phone Number
                </CardTitle>
                <CardDescription className="text-amber-600 dark:text-amber-500">
                  {config?.phone_number || phoneInfo?.display_phone_number} must be verified before you can send messages.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-amber-100/50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-300 space-y-1">
                  <p><strong>Steps:</strong></p>
                  <p>1. Click &quot;Open Meta Business Manager&quot; below</p>
                  <p>2. Go to <strong>WhatsApp &rarr; Phone Numbers</strong></p>
                  <p>3. Click <strong>Verify</strong> next to your number</p>
                  <p>4. Choose SMS or Voice Call, enter the 6-digit code</p>
                  <p>5. Come back and click &quot;Check Verification Status&quot;</p>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <a
                    href={`https://business.facebook.com/wa/manage/phone-numbers/?waba_id=${config?.waba_id || ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="default" className="bg-amber-600 hover:bg-amber-700">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open Meta Business Manager
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    onClick={handleCheckVerification}
                    disabled={checkingStatus}
                    className="border-amber-300 dark:border-amber-700"
                  >
                    {checkingStatus ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Check Verification Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verified Success */}
          {isVerified && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700 dark:text-green-400">Phone Verified</AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-500">
                Your phone number is verified and ready to send messages.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Webhook URL Info (always visible when connected) */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Webhook Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-1">Webhook URL (auto-configured during OAuth)</p>
            <code className="text-xs bg-muted px-2 py-1 rounded">{webhookUrl}</code>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
