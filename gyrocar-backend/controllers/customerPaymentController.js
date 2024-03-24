const db = require('../database');
const stripe = require('stripe')('sk_test_51OC3lZF33393XxHn73d30X9eRVrmyNb0L5oil5tATq4CleGApiF1ryNcIpEvgCi7VVsMAZVWktpwORUNxoVQJliJ00E1JPOfix');


async function getCustomerPayments(req, res) {
    const customerId = req.params.customer_id;
    if (!customerId) {
        return res.status(400).send('Customer ID is required');
    }

    const customer =  await db.select(['customerID', 'stripeCustomerID']).from('Customer').where('customerID', customerId);
    if (customer.length != 1) {
        return res.status(400).send('Customer ID does not exist');
    }

    const stripeCustomerID = customer[0].stripeCustomerID;
    if (!stripeCustomerID) {
        return res.status(400).send('Customer has no payment information');
    }

    let paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerID,
        type: 'card'
    });

    paymentMethods = paymentMethods.data;

    paymentMethods.map((paymentMethod) => {
        paymentMethod["brand"] = paymentMethod["card"]["brand"];
        paymentMethod["last4"] = paymentMethod["card"]["last4"];
        paymentMethod["exp_month"] = paymentMethod["card"]["exp_month"];
        paymentMethod["exp_year"] = paymentMethod["card"]["exp_year"];
        delete paymentMethod["card"];
        delete paymentMethod["type"];
        delete paymentMethod["billing_details"];
        delete paymentMethod["object"];
        delete paymentMethod["created"];
        delete paymentMethod["livemode"];
        delete paymentMethod["metadata"];
    });

    res.send(paymentMethods);
}

module.exports = { getCustomerPayments };