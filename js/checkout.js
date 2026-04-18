/**
 * Stripe Checkout Redirect
 * Uses Stripe.js to redirect to checkout with pre-configured price IDs
 */
const STRIPE_PK = 'pk_live_51TB62iFCjIsAzbKc3N4sb0Lox13aM81B8wZ1Fy5jE2dX88xyygC0KIPxt1spwxbnrFl3Mjb1JI3ZG1pTu0BpYz2y00tthYqsmS';

function checkout(priceId) {
    // Load Stripe.js if not already loaded
    if (typeof Stripe === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = function() { redirectToCheckout(priceId); };
        document.head.appendChild(script);
    } else {
        redirectToCheckout(priceId);
    }
}

function redirectToCheckout(priceId) {
    const stripe = Stripe(STRIPE_PK);
    stripe.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        successUrl: window.location.origin + '/?checkout=success',
        cancelUrl: window.location.origin + '/?checkout=cancel',
    }).then(function(result) {
        if (result.error) {
            alert(result.error.message);
        }
    });
}

// Auto-handle URL params for checkout
const urlParams = new URLSearchParams(window.location.search);
const checkoutTier = urlParams.get('checkout');
if (checkoutTier) {
    // This is handled by intake-bot.js
}
