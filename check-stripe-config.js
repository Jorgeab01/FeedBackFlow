const Stripe = require('stripe');
require('dotenv').config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function checkConfigs() {
    try {
        const configurations = await stripe.billingPortal.configurations.list({
            limit: 10,
        });
        console.log("Configurations:", JSON.stringify(configurations.data, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkConfigs();
