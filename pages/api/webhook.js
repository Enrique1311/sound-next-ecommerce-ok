import { mongooseConnect } from "../../lib/mongoose";
const stripe = require("stripe")(process.env.STRIPE_SK);
import { buffer } from "micro";
import { Order } from "../../models/Order";

const endpointSecret =
	"whsec_634d3142fd2755bd61adaef74ce0504bd2044848c8aac301ffdb56339a0ca78d";

export default async function handler(req, res) {
	await mongooseConnect();
	const sig = req.headers["stripe-signature"];

	let event;

	try {
		event = stripe.webhooks.constructEvent(
			await buffer(req),
			sig,
			endpointSecret
		);
	} catch (err) {
		res.status(400).send(`Webhook Error: ${err.message}`);
		return;
	}

	// Handle the event
	switch (event.type) {
		case "checkout.session.completed":
			const data = event.data.object;
			const orderId = data.metadata.orderId;
			const paid = data.payment_status === "paid";
			if (orderId && paid) {
				await Order.findByIdAndUpdate(orderId, {
					paid: true,
				});
			}
			break;
		default:
			console.log(`Unhandled event type ${event.type}`);
	}

	res.status(200).send("ok");
}

export const config = {
	api: { bodyParser: false },
};

// bright-thrift-cajole-lean
// acct_1Lj5ADIUXXMmgk2a

// import { mongooseConnect } from "../../lib/mongoose";
// const mercadopago = require("mercadopago");
// import { buffer } from "micro";
// import { Order } from "../../models/Order";

// mercadopago.configure({
// 	access_token: process.env.MP_ACCESS_TOKEN,
// });

// const endpointSecret = "";

// try {
// 	const body = await buffer(req);
// 	const data = JSON.parse(body.toString());

// 	// Handle the event
// 	switch (data.type) {
// 		case "payment":
// 			const orderId = data.data.id;
// 			const paid = data.data.status === "approved";
// 			if (orderId && paid) {
// 				await Order.findByIdAndUpdate(orderId, {
// 					paid: true,
// 				});
// 			}
// 			break;
// 		default:
// 			console.log(`Unhandled event type ${data.type}`);
// 	}
// } catch (err) {
// 	res.status(400).send(`Webhook Error: ${err.message}`);
// 	return;
// }

// res.status(200).send("ok");

// export const config = {
// 	api: {
// 		bodyParser: {
// 			sizeLimit: "1mb", // Adjust the size limit if needed
// 		},
// 	},
// };
