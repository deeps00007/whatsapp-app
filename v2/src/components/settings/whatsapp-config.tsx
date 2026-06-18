'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useRealtimeTable, type RealtimeTableEvent } from '@/hooks/use-realtime-table';
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
  MessageSquare,
  CreditCard,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { WhatsAppConfig as WhatsAppConfigType } from '@/types';

export function WhatsAppConfig() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'idle' | 'sending' | 'enter_code' | 'verifying' | 'done'>('idle');
  const [verificationMethod, setVerificationMethod] = useState<'SMS' | 'VOICE'>('SMS');
  const [verificationCode, setVerificationCode] = useState('');
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isCoexistenceNumber, setIsCoexistenceNumber] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<{ payment_method_connected: boolean } | null>(null);
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
        const payRes = await fetch('/api/whatsapp/payment-status');
        if (payRes.ok) {
          const payData = await payRes.json();
          setPaymentStatus(payData);
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

  useEffect(() => {
    if (!cooldownUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining <= 0) {
        setCooldownUntil(null);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  useRealtimeTable<WhatsAppConfigType>({
    table: 'whatsapp_config',
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    enabled: !!user,
    onEvent: (event: RealtimeTableEvent<WhatsAppConfigType>) => {
      if (event.eventType === 'UPDATE') {
        setConfig((prev) => {
          if (!prev || prev.id !== event.new.id) return prev;
          return { ...prev, ...event.new };
        });
        if (event.new.code_verification_status === 'VERIFIED' && config?.code_verification_status !== 'VERIFIED') {
          toast.success('Phone number verified!');
        }
        if (event.new.payment_method_connected && !config?.payment_method_connected) {
          toast.success('Payment method detected!');
          setPaymentStatus((prev) => prev ? { ...prev, payment_method_connected: true } : prev);
        }
      }
    },
  });

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
    } catch (_) {
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
          toast.info('Phone number is not yet verified. Complete verification below.');
        }
      }
    } catch (_) {
      toast.error('Failed to check verification status');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleRequestCode = async (method: 'SMS' | 'VOICE') => {
    setVerificationMethod(method);
    setVerificationStep('sending');
    try {
      const res = await fetch('/api/whatsapp/phone-verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.is_rate_limited) {
          const cooldownSec = data.cooldown_seconds || 3600;
          setCooldownUntil(Date.now() + cooldownSec * 1000);
          setCooldownRemaining(cooldownSec);
          toast.error(`Rate limited — please wait ~${Math.ceil(cooldownSec / 60)} minutes before trying again.`);
          setVerificationStep('idle');
          return;
        }
        if (data.is_coexistence) {
          setIsCoexistenceNumber(true);
          toast.error('This number must be verified through Meta Business Manager (coexistence mode).');
          setVerificationStep('idle');
          return;
        }
        throw new Error(data.error || 'Failed to send code');
      }
      toast.success(`Verification code sent via ${method === 'SMS' ? 'SMS' : 'voice call'}!`);
      setVerificationStep('enter_code');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification code');
      setVerificationStep('idle');
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 4) {
      toast.error('Please enter the verification code');
      return;
    }
    setVerificationStep('verifying');
    try {
      const res = await fetch('/api/whatsapp/phone-verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }
      toast.success('Phone number verified successfully!');
      setVerificationStep('done');
      if (user) fetchConfig(user.id);
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
      setVerificationStep('enter_code');
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
                  {config?.phone_number || phoneInfo?.display_phone_number} must be verified before you can send broadcast messages.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isCoexistenceNumber ? (
                  <>
                    <div className="rounded-lg bg-amber-100/50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-300 space-y-2">
                      <p><strong>This number is linked to the WhatsApp Business app (coexistence mode).</strong></p>
                      <p>Coexistence numbers must be verified through Meta Business Manager. Click below to open it:</p>
                      <ol className="list-decimal ml-4 space-y-1">
                        <li>Open Meta Business Manager</li>
                        <li>Go to <strong>WhatsApp → Phone Numbers</strong></li>
                        <li>Click <strong>Verify</strong> next to your number</li>
                        <li>Enter the 6-digit code sent to your phone</li>
                        <li>Come back and click &quot;Check Verification Status&quot;</li>
                      </ol>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <a
                        href={`https://business.facebook.com/wa/manage/phone-numbers/?waba_id=${config?.waba_id || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="bg-amber-600 hover:bg-amber-700">
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
                  </>
                ) : verificationStep === 'idle' ? (
                  <>
                    <div className="rounded-lg bg-amber-100/50 dark:bg-amber-900/20 p-4 text-sm text-amber-800 dark:text-amber-300 space-y-1">
                      <p><strong>Why verify?</strong> Unverified numbers cannot send template messages (broadcasts) to new contacts. Verified numbers build quality rating and unlock full messaging.</p>
                    </div>
                    {cooldownUntil && cooldownRemaining > 0 ? (
                      <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-3 text-sm text-amber-800 dark:text-amber-300">
                        Please wait <strong>{Math.floor(cooldownRemaining / 60)}:{String(cooldownRemaining % 60).padStart(2, '0')}</strong> before requesting another code.
                      </div>
                    ) : (
                      <div className="flex gap-3 flex-wrap">
                        <Button
                          onClick={() => handleRequestCode('SMS')}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Send Code via SMS
                        </Button>
                        <Button
                          onClick={() => handleRequestCode('VOICE')}
                          variant="outline"
                          className="border-amber-300 dark:border-amber-700"
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          Send Code via Call
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCheckVerification}
                        disabled={checkingStatus}
                        className="text-amber-600 hover:text-amber-700 text-xs"
                      >
                        {checkingStatus ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
                        Already verified in Meta? Check status
                      </Button>
                    </div>
                  </>
                ) : verificationStep === 'sending' ? (
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending verification code via {verificationMethod}…
                  </div>
                ) : (verificationStep === 'enter_code' || verificationStep === 'verifying') ? (
                  <div className="space-y-3">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      We sent a code to <strong>{config?.phone_number || phoneInfo?.display_phone_number}</strong> via {verificationMethod}. Enter it below.
                    </p>
                    <div className="flex gap-3 items-center">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Enter 6-digit code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        className="w-48 border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900"
                        autoFocus
                      />
                      <Button
                        onClick={handleVerifyCode}
                        disabled={verificationStep === 'verifying' || verificationCode.length < 4}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {verificationStep === 'verifying' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Verify
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => { setVerificationStep('idle'); setVerificationCode(''); }}
                        className="text-amber-600 hover:text-amber-700"
                      >
                        Cancel
                      </Button>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                      Didn&apos;t receive the code?{' '}
                      <button
                        onClick={() => handleRequestCode(verificationMethod)}
                        className="underline hover:no-underline"
                      >
                        Resend via {verificationMethod}
                      </button>
                      {' | '}
                      <button
                        onClick={() => handleRequestCode(verificationMethod === 'SMS' ? 'VOICE' : 'SMS')}
                        className="underline hover:no-underline"
                      >
                        Try {verificationMethod === 'SMS' ? 'Voice Call' : 'SMS'} instead
                      </button>
                    </p>
                  </div>
                ) : verificationStep === 'done' ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Phone number verified! You can now send broadcast messages.</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Payment Method Card */}
          {isConnected && !paymentStatus?.payment_method_connected && (
            <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <CreditCard className="h-5 w-5" />
                  Add Payment Method
                </CardTitle>
                <CardDescription className="text-red-600 dark:text-red-500">
                  Meta requires a payment method to deliver your messages. Without it, messages will be accepted but not delivered.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg bg-red-100/50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-300">
                  <p>This step must be completed in Meta Business Manager. We cannot add payment methods through our platform — it&apos;s a Meta requirement.</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <a
                    href="https://business.facebook.com/settings/payment-methods/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-red-600 hover:bg-red-700">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Add Payment in Meta
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const res = await fetch('/api/whatsapp/payment-status');
                      if (res.ok) {
                        const data = await res.json();
                        setPaymentStatus(data);
                        if (data.payment_method_connected) {
                          toast.success('Payment method detected!');
                        } else {
                          toast.info('No payment method found yet. Add one in Meta Business Manager.');
                        }
                      }
                    }}
                    className="border-red-300 dark:border-red-700"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Re-check Payment Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verified Success */}
          {isVerified && verificationStep !== 'done' && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700 dark:text-green-400">Phone Verified</AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-500">
                Your phone number is verified and ready to send messages.
              </AlertDescription>
            </Alert>
          )}

          {paymentStatus?.payment_method_connected && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
              <CreditCard className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700 dark:text-green-400">Payment Method Connected</AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-500">
                Your Meta payment method is active. Messages will be delivered.
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
