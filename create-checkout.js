const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const bookingData = JSON.parse(event.body);
    
    // Get the service cost (default to $120 if not provided)
    const amount = bookingData.estimatedCost || 12000; // Amount in cents
    
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'DontPark Car Service',
              description: `${bookingData.year} ${bookingData.makeModel} - ${bookingData.serviceDescription || 'Vehicle Service'}`,
            },
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/?canceled=true`,
      customer_email: bookingData.email,
      metadata: {
        customerName: bookingData.fullName,
        customerPhone: bookingData.phone,
        customerEmail: bookingData.email,
        shopId: bookingData.shopId,
        flightDate: bookingData.departureDate,
        flightTime: bookingData.departureTime,
        returnDate: bookingData.returnDate,
        returnTime: bookingData.returnTime,
        returnFlight: bookingData.returnFlight,
        year: bookingData.year,
        makeModel: bookingData.makeModel,
        licensePlate: bookingData.licensePlate,
        color: bookingData.color,
        serviceDescription: bookingData.serviceDescription || 'Vehicle Service',
        customerNotes: bookingData.customerNotes || '',
        estimatedCost: bookingData.estimatedCost || 120
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      })
    };

  } catch (error) {
    console.error('Stripe Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message 
      })
    };
  }
};
