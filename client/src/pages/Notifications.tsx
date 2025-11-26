import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Bell, Check } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  fromUserName?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function Notifications() {
  const [, setLocation] = useLocation();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 3000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiRequest('POST', `/api/notifications/${notificationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'challenge':
        return '🎮';
      case 'friend_request':
        return '👥';
      case 'game_finished':
        return '🏁';
      case 'achievement':
        return '🏆';
      default:
        return '📬';
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/')}
            className="text-purple-200 hover:text-white hover:bg-purple-500/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Bell className="w-8 h-8" />
              Notifications
            </h1>
            <p className="text-purple-200">{unreadCount} unread</p>
          </div>
        </div>

        {notifications.length === 0 ? (
          <Card className="border-purple-500/20 bg-slate-900/50 backdrop-blur">
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 text-purple-400 mx-auto mb-4 opacity-50" />
              <p className="text-purple-300 text-lg">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => (
              <Card
                key={notif.id}
                className={`border-purple-500/20 backdrop-blur transition-all ${
                  notif.read
                    ? 'bg-slate-800/30'
                    : 'bg-purple-900/50 border-purple-500/50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{getIcon(notif.type)}</span>
                      <div>
                        <p className={notif.read ? 'text-purple-300' : 'text-white font-semibold'}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-purple-400 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {!notif.read && (
                      <Button
                        size="sm"
                        onClick={() => markReadMutation.mutate(notif.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
