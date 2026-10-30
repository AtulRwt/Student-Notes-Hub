// Sound notification utility for chat messages

class SoundNotification {
  private audio: HTMLAudioElement | null = null;
  private enabled = true;

  constructor() {
    // Create audio element for notification sound
    // Using a simple beep sound encoded as data URI
    const beepSound = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURE';

    try {
      this.audio = new Audio(beepSound);
      this.audio.volume = 0.5;
    } catch (error) {
      console.warn('Sound notification not available:', error);
    }
  }

  play() {
    if (this.enabled && this.audio) {
      // Reset audio to beginning
      this.audio.currentTime = 0;

      // Play sound (catch error if user hasn't interacted with page yet)
      this.audio.play().catch((error) => {
        console.debug('Could not play notification sound:', error);
      });
    }
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  isEnabled() {
    return this.enabled;
  }

  setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }
}

// Export singleton instance
export const soundNotification = new SoundNotification();

// Browser notification utility
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const showBrowserNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    } catch (error) {
      console.warn('Could not show notification:', error);
    }
  }
};
