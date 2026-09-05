import {
  trigger,
  animate,
  transition,
  style,
  query,
} from '@angular/animations';

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    // Initial state of the new route
    query(':enter', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        opacity: 0,
        transform: 'translateY(10px)'
      })
    ], { optional: true }),
    
    // Animation for entering route
    query(':enter', [
      animate('0.3s ease-in-out', style({
        opacity: 1,
        transform: 'translateY(0)'
      }))
    ], { optional: true })
  ])
]);
