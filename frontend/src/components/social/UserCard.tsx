import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../shared/Avatar';
import { useNetworkStore } from '../../store/networkStore';
import ConnectButton from './ConnectButton';
import FollowButton from './FollowButton';

interface UserCardProps {
  user: {
    id: string;
    name: string;
    profileImage: string | null;
    bio: string | null;
    _count?: {
      notes: number;
      followers: number;
    };
  };
  size?: 'sm' | 'md' | 'lg';
}

const UserCard = ({ user, size = 'md' }: UserCardProps) => {
  const { checkRelationship } = useNetworkStore();
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    sentRequest: null as string | null,
    receivedRequest: null as string | null,
  });
  const [followStatus, setFollowStatus] = useState({
    following: false,
  });

  useEffect(() => {
    const loadRelationship = async () => {
      if (!user.id) return;

      try {
        const relationshipStatus = await checkRelationship(user.id);
        setConnectionStatus({
          connected: relationshipStatus.connected,
          sentRequest: relationshipStatus.sentRequest,
          receivedRequest: relationshipStatus.receivedRequest,
        });
        setFollowStatus({
          following: relationshipStatus.following,
        });
      } catch (error) {
        console.error('Error checking relationship status:', error);
      }
    };

    loadRelationship();
  }, [user.id, checkRelationship]);

  // Determine card sizes based on the size prop
  const cardSizes = {
    sm: {
      card: 'p-3',
      avatar: 'sm',
      name: 'text-sm font-medium',
      bio: 'text-xs',
      buttons: 'mt-2 flex-col space-y-1',
      buttonSize: 'sm' as 'sm',
    },
    md: {
      card: 'p-4',
      avatar: 'md',
      name: 'text-base font-medium',
      bio: 'text-sm',
      buttons: 'mt-3 flex space-x-2',
      buttonSize: 'md' as 'md',
    },
    lg: {
      card: 'p-5',
      avatar: 'lg',
      name: 'text-lg font-semibold',
      bio: 'text-base',
      buttons: 'mt-4 flex space-x-3',
      buttonSize: 'lg' as 'lg',
    },
  };

  const sizeConfig = cardSizes[size];

  return (
    <div className={`glass-light rounded-lg ${sizeConfig.card} transition-transform hover:scale-102 hover:shadow-lg`}>
      <div className="flex items-center">
        <Link to={`/profile/${user.id}`}>
          <Avatar
            src={user.profileImage}
            alt={user.name}
            size={sizeConfig.avatar as any}
          />
        </Link>

        <div className="ml-3 flex-1">
          <Link
            to={`/profile/${user.id}`}
            className={`${sizeConfig.name} hover:text-purple-400 transition-colors`}
          >
            {user.name}
          </Link>

          {user.bio && (
            <p className={`${sizeConfig.bio} text-accent line-clamp-1`}>
              {user.bio}
            </p>
          )}

          {user._count && (
            <p className="text-xs text-accent mt-1">
              {user._count.notes} notes · {user._count.followers} followers
            </p>
          )}
        </div>
      </div>

      <div className={`${sizeConfig.buttons}`}>
        <ConnectButton
          userId={user.id}
          initialStatus={connectionStatus}
          onStatusChange={(newStatus) => {
            setConnectionStatus(newStatus);
          }}
          size={sizeConfig.buttonSize}
        />

        {connectionStatus.connected && (
          <FollowButton
            userId={user.id}
            initialFollowing={followStatus.following}
            onStatusChange={(following) => {
              setFollowStatus({ following });
            }}
            size={sizeConfig.buttonSize}
          />
        )}
      </div>
    </div>
  );
};

export default UserCard; 