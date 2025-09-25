import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import { useMessaging } from '@/hooks/use-messaging';
import LinkedInMessaging from './LinkedInMessaging';

interface MessagingTriggerProps {
  className?: string;
}

const MessagingTrigger: React.FC<MessagingTriggerProps> = ({ className = '' }) => {
  const [isMessagingOpen, setIsMessagingOpen] = useState(false);
  const { unreadCount } = useMessaging();

  return (
    <>
      <Button
        onClick={() => setIsMessagingOpen(true)}
        variant="outline"
        className={`relative ${className}`}
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Messages
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <LinkedInMessaging
        isOpen={isMessagingOpen}
        onClose={() => setIsMessagingOpen(false)}
      />
    </>
  );
};

export default MessagingTrigger;