export const getVietnameseGreeting = (): string => {
     const hour = new Date().getHours();
     if (hour < 12) return 'Chào buổi sáng';
     if (hour < 18) return 'Chào buổi chiều';
     return 'Chào buổi tối';
}