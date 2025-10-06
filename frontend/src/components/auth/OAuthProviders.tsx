import React from 'react';
import GoogleOAuthButton from './GoogleOAuthButton';

interface OAuthProvidersProps {
  className?: string;
  onSuccess?: (response: any) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  buttonText?: string;
}

const OAuthProviders: React.FC<OAuthProvidersProps> = ({
  className = '',
  onSuccess,
  onError,
  disabled = false,
  buttonText
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      
      <GoogleOAuthButton
        onSuccess={onSuccess}
        onError={onError}
        disabled={disabled}
        text={buttonText}
      />
    </div>
  );
};

export default OAuthProviders;