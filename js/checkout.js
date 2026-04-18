/**
 * Stripe Checkout Redirect
 * Uses Stripe.js to redirect to checkout with pre-configured price IDs
 * 
 * Usage: 
 *   checkout('price_ID')  — defaults to payment mode
 *   checkout('price_ID', { mode: 'subscription', successUrl: '...', cancelUrl: '...' })
 */
const STRIPE_PK = 'pk_live_51TB62iFCjIsAzbKc3N4sb0Lox13aM81B8wZ1Fy5jE2dX88xyygC0KIPxt1spwxbnrFl3Mjb1JI3ZG1pTu0BpYz2y00tthYqsmS';

function checkout(priceId, opts = {}) {
    const mode = opts.mode || 'payment';
    const successUrl = opts.successUrl || window.location.origin + '/?checkout=success';
    const cancelUrl = opts.cancelUrl || window.location.origin + '/?checkout=cancel';
    
    // Load Stripe.js if not already loaded
    if (typeof Stripe === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.onload = function() { redirectToCheckout(priceId, mode, successUrl, cancelUrl); };
        document.head.appendChild(script);
    } else {
        redirectToCheckout(priceId, mode, successUrl, cancelUrl);
    }
}

function redirectToCheckout(priceId, mode, successUrl, cancelUrl) {
    const stripe = Stripe(STRIPE_PK);
    stripe.redirectToCheckout({
        lineItems: [{ price: priceId, quantity: 1 }],
        mode: mode,
        successUrl: successUrl,
        cancelUrl: cancelUrl,
    }).then(function(result) {
        if (result.error) {
            alert(result.error.message);
        }
    });
}
