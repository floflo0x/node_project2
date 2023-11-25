const express = require('express');

const { body, validationResult } = require('express-validator');

const QRCode = require('qrcode');

const request = require("request");

const baseUrl = "https://bhaveshnetflix.live/web_api/";

const isAuth = require('../middleware/is_auth');

const router = express.Router();

let selectFunction = (item) => {
  let options = {
	  method: "POST",
	  url: baseUrl + "select.php",
	  headers: {
	  	charset: 'UTF-8'
	  },
	  formData: {
	    select_query: item,
	  },
  };
  return options;
};

let insertFunction = (item, item2) => {
  let options = {
    method: "POST",
    url: baseUrl + "insert.php",
    formData: {
      insert_query: item,
      select_query: item2,
    },
  };
  return options;
};

let updateFunction = (item, item2) => {
	let options = {
	    method: "POST",
	    url: baseUrl + "update.php",
	    formData: {
	      update_query: item,
	      select_query: item2,
	    },
  	};
  	return options;
};

let deleteFunction = (item, item2) => {
	let options = {
	    method: "POST",
	    url: baseUrl + "delete.php",
	    formData: {
	      delete_query: item,
	      select_query: item2,
	    },
  	};
  	return options;
};

router.get('/', async(req, res, next) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const itemsPerPage = 10;
		const category = req.query.category || 'new';

		let opt1 = selectFunction(
			"select ec_product_collection_products.product_id, ec_products.name as pName, ec_products.image, ec_products.price, ec_product_collections.slug as label, ec_product_labels.name as lname, ec_product_categories.name as category from ec_product_collections inner join ec_product_collection_products on ec_product_collections.id = ec_product_collection_products.product_collection_id inner join ec_products on ec_product_collection_products.product_id = ec_products.id inner join ec_product_label_products on ec_product_label_products.product_id = ec_products.id inner join ec_product_labels on ec_product_labels.id = ec_product_label_products.product_label_id inner join ec_product_category_product on ec_product_category_product.product_id = ec_product_collection_products.product_id inner join ec_product_categories on ec_product_categories.id = ec_product_category_product.category_id"
		);

		let isAuthenticated = false;

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);
				// console.log(req.session);

				// console.log(x.length, category, page);
				// console.log(req.session.isLoggedIn, req.session.user, req.session.user == '');

				const email = req.session.user;

				(email !== '' ? isAuthenticated = true : isAuthenticated = false);

				// console.log(isAuthenticated);

				let opt2 = selectFunction(
					"select * from hCart where email = '"
					.concat(`${email}`)
					.concat("'")
				);

				request(opt2, (error, response) => {
					if (error) throw new Error(error);
					else {
						let y = JSON.parse(response.body);

						// console.log(y);

						if (x.length >= 1) {
							const newProducts = x.filter((product) => product.label === 'new-arrival');
							const bestSellers = x.filter((product) => product.label === 'best-sellers');
							const specialOffers = x.filter((product) => product.label === 'special-offer');

							// console.log(newProducts, bestSellers, specialOffers);
							let nPPages = [];
							let bSPages = [];
							let sOPages = [];

							if (category === 'new') {
								nPPages = paginateProducts(newProducts, page);
								bSPages = paginateProducts(bestSellers, cp = 1);
								sOPages = paginateProducts(specialOffers, cp = 1);
							}

							else if (category === 'bestsellers') {
								nPPages = paginateProducts(newProducts, cp = 1);
								bSPages = paginateProducts(bestSellers, page);
								sOPages = paginateProducts(specialOffers, cp = 1);
							}

							else if (category === 'special_offer') {
								nPPages = paginateProducts(newProducts, cp = 1);
								bSPages = paginateProducts(bestSellers, cp = 1);
								sOPages = paginateProducts(specialOffers, page);
							}

							else {
								nPPages = paginateProducts(newProducts, cp = 1);
								bSPages = paginateProducts(bestSellers, cp = 1);
								sOPages = paginateProducts(specialOffers, cp = 1);
							}

					    function paginateProducts(newProducts, cp) {
								const totalCount = newProducts.length;
					      const pageCount = Math.ceil(totalCount / itemsPerPage);

					      // Calculate start and end indices for pagination
					      const startIndex = (cp - 1) * itemsPerPage;
					      const endIndex = startIndex + itemsPerPage;

					      // Slice the results array based on pagination
					      const paginatedResults = newProducts.slice(startIndex, endIndex);
					      // console.log(paginatedResults);
					      return {data: paginatedResults, pageCount: pageCount};
					    }

							const { data: nData, pageCount: nPC } = nPPages;
							const { data: bsData, pageCount: bsPC } = bSPages;
							const { data: soData, pageCount: soPC } = sOPages;

							// console.log(nPC, bsPC, soPC);
							// console.log(nData.length, bsData.length, soData.length);

							return res.render('user/home', 
								{
									title: "Home",
									lang: req.lang,
									isAuth: isAuthenticated,
									cart: y.length,
									// cart: '6',
									nData: nData,
									bsData: bsData,
									soData: soData,
									category: category,
									currentPage: page,
				        	nPC: nPC,
				        	bsPC: bsPC,
				        	soPC: soPC
								}
							)
						}

						else {
							return res.render('user/home', 
								{
									title: "Home",
									lang: req.lang,
									isAuth: isAuthenticated,
									cart: y.length,
									nData: [],
									bsData: [],
									soData: [],
									category: category,
									currentPage: page,
				        	nPC: 0,
				        	bsPC: 0,
				        	soPC: 0
								}
							)
						}
					}
				})
			}
		})
	}

	catch(error) {
		return res.render('user/home', 
			{
				title: "Home",
				lang: req.lang,
				isAuth: isAuthenticated,
				cart: '0',
				nData: [],
				bsData: [],
				soData: [],
				category: '',
				currentPage: '',
				nPC: 0,
				bsPC: 0,
				soPC: 0
			}
		)
	}
})

router.get('/v1/details/:name', async (req, res, next) => {
	try {
		const { name } = req.params;

		// console.log(name);

		let opt1 = selectFunction(
			"select ec_products.id, ec_products.name as pName, ec_products.image, ec_products.price, ec_products.description, ec_products.stock_status, ec_product_categories.name as category, ec_product_labels.name as label from ec_products left join ec_product_category_product on ec_product_category_product.product_id = ec_products.id left join ec_product_categories on ec_product_categories.id = ec_product_category_product.category_id left join ec_product_label_products on ec_product_label_products.product_id = ec_products.id left join ec_product_labels on ec_product_labels.id = ec_product_label_products.product_label_id where ec_products.name LIKE '%"
				.concat(`${name}`)
				.concat("%' limit 10 offset 0")
		);

		let isAuthenticated = false;

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);

				const email = req.session.user;

				(email !== '' ? isAuthenticated = true : isAuthenticated = false);

				// console.log(isAuthenticated);

				const category = x[0].category;
				const label = x[0].label;

				// console.log(category, label);

				let opt2 = selectFunction(
					"select ec_products.id, ec_products.name as pName, ec_products.image, ec_products.price, ec_product_categories.name as category, ec_product_labels.name as label from ec_products left join ec_product_category_product on ec_product_category_product.product_id = ec_products.id left join ec_product_categories on ec_product_categories.id = ec_product_category_product.category_id left join ec_product_label_products on ec_product_label_products.product_id = ec_products.id left join ec_product_labels on ec_product_labels.id = ec_product_label_products.product_label_id where ec_product_categories.name = '"
					.concat(`${category}`)
					// .concat("' AND ec_product_collections.slug = '")
					// .concat(`${label}`)
					.concat("' limit 3 offset 0")
				);

				request(opt2, (error, response) => {
					if (error) throw new Error(error);
					else {
						let z = JSON.parse(response.body);

						// console.log(z);

						if (x.length >= 1) {
							let opt3 = selectFunction(
								"select * from hCart where email = '"
									.concat(`${email}`)
									.concat("'")
							);

							request(opt3, (error, response) => {
								if (error) throw new Error(error);
								else {
									let y = JSON.parse(response.body);

									// console.log(y);

									if (y.length >= 1) {
										return res.render("user/details", {
											title: "Details",
											lang: req.lang,
											products: x,
											name: name,
											relatedProduct: z,
											isAuth: isAuthenticated,
											cart: y.length
										})
									}

									else {
										return res.render('user/details', 
											{
												title: "Details",
												lang: req.lang,
												products: x,
												name: name,
												relatedProduct: z,
												isAuth: isAuthenticated,
												cart: 0
											}
										)
									}
								}
							})
						}

						else {
							return res.render('user/details', 
								{
									title: "Details",
									lang: req.lang,
									products: x,
									name: name,
									relatedProduct: z,
									isAuth: isAuthenticated,
									cart: 0
								}
							)
						}
					}
				})
			}
		})
	}

	catch(error) {
		return res.render('user/details', 
			{
				title: "Details",
				lang: req.lang,
				products: [],
				name: '',
				relatedProduct: [],
				isAuth: false,
				cart: '0'
			}
		)
	}
})

router.get('/v1/product_categories', async (req, res, next) => {
	try {
		const { category, name } = req.query;

		const page = parseInt(req.query.page) || 1;
		const itemsPerPage = 10;

		// console.log(category, name, page);

		let opt1 = '';

		let isAuthenticated = false;

		if (category == 'all' && !name) {
			opt1 = selectFunction(
				"select ec_products.id, ec_products.name as pName, ec_products.image, ec_products.price, ec_product_categories.name as category, ec_product_labels.name as label from ec_products left join ec_product_category_product on ec_product_category_product.product_id = ec_products.id left join ec_product_categories on ec_product_categories.id = ec_product_category_product.category_id left join ec_product_label_products on ec_product_label_products.product_id = ec_products.id left join ec_product_labels on ec_product_labels.id = ec_product_label_products.product_label_id"
			);
		}

		else if (!category && name !== '') {
			opt1 = selectFunction(
				"select ec_products.id, ec_products.name as pName, ec_products.image, ec_products.price, ec_product_categories.name as category, ec_product_labels.name as label from ec_products left join ec_product_category_product on ec_product_category_product.product_id = ec_products.id left join ec_product_categories on ec_product_categories.id = ec_product_category_product.category_id left join ec_product_label_products on ec_product_label_products.product_id = ec_products.id left join ec_product_labels on ec_product_labels.id = ec_product_label_products.product_label_id where ec_products.name LIKE '%"
				.concat(`${name}`)
				.concat("%'")
			);
		}

		else if (category !== '' && name !== '') {
			opt1 = selectFunction(
				"select ec_products.id, ec_products.name as pName, ec_products.image, ec_products.price, ec_product_categories.name as category, ec_product_labels.name as label from ec_products left join ec_product_category_product on ec_product_category_product.product_id = ec_products.id left join ec_product_categories on ec_product_categories.id = ec_product_category_product.category_id left join ec_product_label_products on ec_product_label_products.product_id = ec_products.id left join ec_product_labels on ec_product_labels.id = ec_product_label_products.product_label_id where ec_product_categories.name = '"
				.concat(`${category}`)
				.concat("' AND ec_products.name LIKE '%")
				.concat(`${name}`)
				.concat("%'")
			);
		}

		else if (category !== '' && !name) {
			opt1 = selectFunction(
				"select ec_products.id, ec_products.name as pName, ec_products.image, ec_products.price, ec_product_categories.name as category, ec_product_labels.name as label from ec_products left join ec_product_category_product on ec_product_category_product.product_id = ec_products.id left join ec_product_categories on ec_product_categories.id = ec_product_category_product.category_id left join ec_product_label_products on ec_product_label_products.product_id = ec_products.id left join ec_product_labels on ec_product_labels.id = ec_product_label_products.product_label_id where ec_product_categories.name = '"
				.concat(`${category}`)
				.concat("'")
			);
		}

		else if (!category && !name) {
			opt1 = selectFunction(
				"select ec_products.id, ec_products.name as pName, ec_products.image, ec_products.price, ec_product_categories.name as category, ec_product_labels.name as label from ec_products left join ec_product_category_product on ec_product_category_product.product_id = ec_products.id left join ec_product_categories on ec_product_categories.id = ec_product_category_product.category_id left join ec_product_label_products on ec_product_label_products.product_id = ec_products.id left join ec_product_labels on ec_product_labels.id = ec_product_label_products.product_label_id"
			);
		}

		else {
			return res.redirect("/");
		}

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);

				const email = req.session.user;

				(email !== '' ? isAuthenticated = true : isAuthenticated = false);

				// console.log(isAuthenticated);

				let opt2 = selectFunction(
					"select * from hCart where email = '"
					.concat(`${email}`)
					.concat("' limit 10 offset 0")
				);

				request(opt2, (error, response) => {
					if (error) throw new Error(error);
					else {
						let z = JSON.parse(response.body);

						// console.log(z);
						if (x.length >= 1) {
							const totalCount = x.length;
				      const pageCount = Math.ceil(totalCount / itemsPerPage);

				      // Calculate start and end indices for pagination
				      const startIndex = (page - 1) * itemsPerPage;
				      const endIndex = startIndex + itemsPerPage;

				      // Slice the results array based on pagination
				      const paginatedResults = x.slice(startIndex, endIndex);
				      // console.log(paginatedResults);
				      // console.log(pageCount);

							return res.render("user/category", {
								title: "Category",
								lang: req.lang,
								products: paginatedResults,
								category: category,
								name: name,
								isAuth: isAuthenticated,
								cart: z.length,
								currentPage: page,
				        pageCount: pageCount
							})
						}

						else {
							return res.render("user/category", {
								title: "Category",
								lang: req.lang,
								products: [],
								category: category,
								name: name,
								isAuth: isAuthenticated,
								cart: z.length,
								currentPage: 0,
				        pageCount: 0
							})
						}
					}
				})
			}
		})
	}

	catch(error) {
		return res.redirect("/");
	}
})

// isAuth
router.post('/v1/cart', isAuth, async (req, res, next) => {
	try {
		const { quantity, productId } = req.body;

		// console.log(req.body);

		const email = req.session.user;
		// const email = "aabb@gmail.com";

		let opt1 = selectFunction(
			"select * from ec_products where id = '"
			.concat(`${productId}`)
			.concat("' limit 10 offset 0")
		);

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);

				if (x.length >= 1) {
					let values1 = `\'${email}\', '${productId}\', '${quantity}\'`;

					let opt2 = insertFunction(
					  "insert into hCart (email, product_id, quantity) values(" 
					  .concat(`${values1}`)
					  .concat(")"),
						"select * from hCart where email = '"
						.concat(`${email}`)
						.concat("' limit 10 offset 0")
					);

					request(opt2, (error, response) => {
						if (error) throw new Error(error);
						else {
							let y = JSON.parse(response.body);

							// console.log(y);

							if (y.length >= 1) {
								return res.redirect("/v1/cart");
							}

							else {
								return res.redirect("/v1/cart");
							}
						}
					})
				}

				else {
					return res.redirect("/v1/cart");
				}
			}
		})
	}

	catch(error) {
		return res.redirect("/v1/cart");
	}
})

router.get("/v1/cart", async (req, res, next) => {
	const email = req.session.user;
	// const email = "a@gmail.com";

	let message = req.flash('error');
	// console.log(message);

	if (message.length > 0) {
		message = message[0];
	}
	else {
		message = null;
	}

	if (email) {
		let opt1 = selectFunction(
			"select * from hCart where email = '"
			.concat(`${email}`)
			.concat("' limit 10 offset 0")
		);

		request(opt1, async (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);

				if (x.length >= 1) {
					let opt2 = selectFunction(
						"select SUM(hCart.quantity * ec_products.price) AS totalPrice from hCart INNER JOIN ec_products ON hCart.product_id=ec_products.id WHERE email = '"
						.concat(`${email}`)
						.concat("'")
					);

					request(opt2, async (error, response) => {
						if (error) throw new Error(error);
						else {
							let y = JSON.parse(response.body);

							// console.log(y);

							let opt3 = selectFunction(
								"select hCart.quantity, ec_products.price, ec_products.name, ec_products.image, ec_products.id from hCart INNER JOIN ec_products ON hCart.product_id=ec_products.id WHERE email = '"
								.concat(`${email}`)
								.concat("'")
							);

							request(opt3, async (error, response) => {
								if (error) throw new Error(error);
								else {
									let z = JSON.parse(response.body);

									// console.log(z);

									if (z.length >= 1) {
										return res.render("user/cart", {
											title: 'Cart',
											lang: req.lang,
											errorMessage: message,
											products: z,
											isAuth: true,
											cart: x.length
										})
									}

									else {
										return res.render("user/cart", {
											title: 'Cart',
											lang: req.lang,
											errorMessage: message,
											products: [],
											isAuth: true,
											cart: x.length
										})
									}
								}
							})
						}
					})
				} 

				else {
					return res.render("user/cart", {
						title: 'Cart',
						lang: req.lang,
						errorMessage: message,
						products: [],
						isAuth: true,
						cart: x.length
					})
				}
			}
		})
	}

	else {
		return res.render("user/cart", {
			title: 'Cart',
			lang: req.lang,
			errorMessage: message,
			products: [],
			isAuth: false,
			cart: '0'
		})
	}
})

// isAuth
router.post("/v1/updateCart", isAuth, async (req, res, next) => {
	try {
		const { quantity, productId } = req.body;

		// console.log(req.body);

		const email = req.session.user;
		// const email = "a@gmail.com";

		let opt1 = selectFunction(
			"select * from ec_products where id = '"
			.concat(`${productId}`)
			.concat("' limit 10 offset 0")
		);

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);

				if (x.length >= 1) {
					let opt2 = updateFunction(
						"update hCart SET quantity = '"
							.concat(`${quantity}`)
							.concat("' where product_id = '")
							.concat(`${productId}`)
							.concat("' AND email = '")
							.concat(`${email}`)
							.concat("'"),
						"select * from hCart where email = '"
							.concat(`${email}`)
							.concat("' limit 10 offset 0")
					);

					request(opt2, (error, response) => {
						if (error) throw new Error(error);
						else {
							let y = JSON.parse(response.body);

							// console.log(y);

							if (y.length >= 1) {
								return res.redirect("/v1/cart");
							}

							else {
								return res.redirect("/v1/cart");
							}
						}
					})
				}

				else {
					return res.redirect("/v1/cart");
				}
			}
		})
	}
	catch(error) {
		return res.redirect("/v1/cart");
	}
})

// isAuth
router.post("/v1/deleteCart", isAuth, async (req, res, next) => {
	try {
		const { productId } = req.body;

		// console.log(req.body);

		const email = req.session.user;
		// const email = "a@gmail.com";

		let opt1 = deleteFunction(
			"delete from hCart where product_id = '"
			.concat(`${productId}`)
			.concat("' AND email = '")
			.concat(`${email}`)
			.concat("'"),
			"select * from hCart where email = '"
			.concat(`${email}`)
			.concat("' limit 10 offset 0")
		);

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);

				if (x.length >= 1) {
					return res.redirect("/v1/cart");
				}

				else {
					return res.redirect("/v1/cart");
				}
			}
		})
	}
	catch(error) {
		return res.redirect("/v1/cart");
	}
})

router.post("/v1/buyNow", isAuth, async (req, res, next) => {
	try {
		const { quantity, productId } = req.body;

		console.log(req.body);

		const email = req.session.user;
		// const email = "aabb@gmail.com";

		let opt1 = selectFunction(
			"select * from ec_products where id = '"
			.concat(`${productId}`)
			.concat("' limit 10 offset 0")
		);

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);

				if (x.length >= 1) {
					let values1 = `\'${email}\', '${productId}\', '${quantity}\'`;

					let opt2 = insertFunction(
					  "insert into hCart (email, product_id, quantity) values(" 
					  .concat(`${values1}`)
					  .concat(")"),
						"select * from hCart where email = '"
						.concat(`${email}`)
						.concat("' limit 10 offset 0")
					);

					request(opt2, (error, response) => {
						if (error) throw new Error(error);
						else {
							let y = JSON.parse(response.body);

							// console.log(y);

							if (y.length >= 1) {
								// let opt3 = deleteFunction(
								// 	"delete from hCart where product_id = '"
								// 	.concat(`${productId}`)
								// 	.concat("' AND email = '")
								// 	.concat(`${email}`)
								// 	.concat("'"),
								// 	"select * from hCart where email = '"
								// 	.concat(`${email}`)
								// 	.concat("' limit 10 offset 0")
								// );

								// request(opt3, (error, response) => {
								// 	if (error) throw new Error(error);
								// 	else {
								// 		let z = JSON.parse(response.body);
								// 		return res.redirect("/v1/payments");
								// 	}
								// })
								return res.redirect("/v1/payments");
							}

							else {
								return res.redirect("/");
							}
						}
					})
				}

				else {
					return res.redirect("/");
				}
			}
		})
	}

	catch(error) {
		return res.redirect("/");
	}
})

// isAuth
router.get("/v1/payments", isAuth, async (req, res, next) => {
	try {
		const email = req.session.user;
		// const email = "a@gmail.com";

		let message = req.flash('error');
		// console.log(message);

		if (message.length > 0) {
			message = message[0];
		}
		else {
			message = null;
		}

		let opt1 = selectFunction(
			"select SUM(hCart.quantity * ec_products.price) AS totalPrice from hCart INNER JOIN ec_products ON hCart.product_id=ec_products.id WHERE email = '"
			.concat(`${email}`)
			.concat("'")
		);

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);

				if (x.length >= 1) {
					const opt2 = {
					  'method': 'GET',
					  'url': 'https://api-sandbox.nowpayments.io/v1/full-currencies',
					  'headers': {
					    'x-api-key': '5RBGE0W-0MTMWKD-KEHQK25-DX4Q6Q5'
					  }
					};
					request(opt2, function (error, response) {
					  if (error) throw new Error(error);
					  // console.log(response.body);

					  let y = JSON.parse(response.body);
					  // console.log(y);

					  if (y.currencies.length >= 1) {
					  	const getCurrency = y.currencies.filter(i => {
						    if(i.code.toUpperCase() == 'BTC' || i.code.toUpperCase() == 'ETH' 
					  			|| i.code.toUpperCase() == 'LTC' || i.code.toUpperCase() == 'TRX' 
					  			|| i.code.toUpperCase() == 'USDTERC20' || i.code.toUpperCase() == 'USDTTRC20') {
						        return true;
						    }
							}).map(j => { return { code: j.code, name: j.name, imgUrl: j.logo_url } });

					  	// console.log(getCurrency);

					  	return res.render("user/payment", {
								title: "Payments",
						    lang: req.lang,
								total: Number(x[0].totalPrice).toFixed(4),
								currency: getCurrency,
								email: email,
	    					errorMessage: message,
							})
					  }

						else {
							req.flash('error', 'Try Again...');
							return res.redirect("/v1/cart");
						}
					});
				}

				else {
					req.flash('error', 'Try Again...');
					return res.redirect("/v1/cart");
				}
			}
		})
	}
	catch(error) {
		return res.redirect("/v1/cart");
	}
})

// isAuth
router.post("/v1/pay", isAuth, async (req, res, next) => {
	try {
		const crypto = req.body.crypto[0];

		// console.log(req.body.crypto[0]);

		const email = req.session.user;
		// const email = 'aabb@gmail.com';

		let opt1 = selectFunction(
			"select SUM(hCart.quantity * ec_products.price) AS totalPrice from hCart INNER JOIN ec_products ON hCart.product_id=ec_products.id WHERE email = '"
			.concat(`${email}`)
			.concat("'")
		);

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);

				if(x.length >= 1) {
					const total = parseFloat(x[0].totalPrice).toFixed(2);

					const uid = req.user.id;

					// console.log(uid, crypto, x);

					let opt2 = selectFunction(
						"select hCart.product_id as id, hCart.quantity as qty, ec_products.name, ec_products.image, ec_products.price from hCart left join ec_products on hCart.product_id=ec_products.id where email = '"
							.concat(`${email}`)
							.concat("'")
					);

					request(opt2, async (error, response) => {
						if (error) throw new Error(error);
						else {
							let y = await JSON.parse(response.body);

							const myJSON = JSON.stringify(
								{
									"uid": uid,
									"email": req.user.email,
									"products": y,
									"total": total,
									"crypto": crypto
								}
							);

							// console.log(myJSON);

							const opt3 = {
							  'method': 'POST',
							  'url': 'https://bhaveshnetflix.live/web_api/getPayAddress.php',
							  'headers': {
							    'Content-Type': 'application/json'
							  },
							  body: myJSON
							};

							request(opt3, function (error, response) {
							  if (error) throw new Error(error);
							  else {
								  // console.log(response.body);
								  let z = JSON.parse(response.body);

								  // console.log(z);

								  if (z !== '') {
								  	const address = z.pay_address;
								  	const paymentId = z.paymentId;
										let iUrl = '';

										QRCode.toDataURL(address, function (err, url) {
										  if (err) {
										    // Handle any errors that may occur when generating the QR code
										    console.error(err);
												return res.redirect("/v1/cart");
										  } 
										  else {
										    iUrl = url;

										    // console.log(iUrl);

										    return res.render('user/cryptoQR', {
										      title: "PAYNOW",
										      lang: req.lang,
										      address: address,
										      amount: z.pay_amount,
										      currency: crypto,
										      cAmt: z.price_amount,
										      iSrc: iUrl
										    });
										  }
										})
									}
									else {
					 					req.flash('error', 'Try Again...');
										return res.redirect("/v1/cart");
									}
								}
							});
						}
					})


					// if (z2.length >= 1) {
					// 	// console.log(address);

					// 	let iUrl = '';

					// 	QRCode.toDataURL(address, function (err, url) {
					// 			if (err) {
					// 			  // Handle any errors that may occur when generating the QR code
					// 			  console.error(err);
					// 			return res.redirect("/v1/cart");
					// 			} 
					// 			else {
					// 			  iUrl = url;

					// 			  // console.log(iUrl);

					// 			  return res.render('user/cryptoQR', {
					// 			    title: "PAYNOW",
					// 			    lang: req.lang,
					// 			    address: address,
					// 			    amount: y.pay_amount,
					// 			    currency: y.pay_currency,
					// 			    cAmt: Number(y.price_amount).toFixed(4),
					// 			    iSrc: iUrl
					// 			  });
					// 			}
					// 	})
					// }

					// else {
					// 	req.flash('error', 'Try Again...');
					// 	return res.redirect("/v1/cart");
					// }
				}

				else {
					return res.redirect("/v1/cart");
				}
			}
		})
	}

	catch(error) {
		console.log(error);
		return res.redirect("/v1/cart");
	}
})

// isAuth
router.get("/v1/thanku", isAuth, async (req, res, next) => {
	try {
		const email = req.user.email;

		// let isAuthenticated = false;

		// (uid !== '' ? isAuthenticated = true : isAuthenticated = false);

		let opt1 = deleteFunction(
			"delete from hCart where email = '"
				.concat(`${email}`)
				.concat("'"),
			"select * from hCart where email = '"
				.concat(`${email}`)
				.concat("'")
		);

		request(opt1, async (error, response) => {
			if (error) throw new Error(error);
			else {
				let y = await JSON.parse(response.body);

				// console.log(y);

				return res.render("user/thanku", 
					{
						title: "Thanku",
						lang: req.lang,
						isAuth: true,
						cart: 0,
					}
				)
			}
		})
	}
	catch(error) {
		console.log(error);
		return res.redirect("/v1/cart");
	}
})

// isAuth
router.get("/v1/getOrders", isAuth, async (req, res, next) => {
	try {
		const uid = req.user.id;
		const email = req.user.email;

		const page = parseInt(req.query.page) || 1;
		const itemsPerPage = 10;

		let offset = 0;

		if (page == 1) {
			offset = 0;
		}
		else {
			offset = 10 * (page - 1);
		}

		let opt2 = selectFunction(
			`select ec_orders.id as id, ec_order_product.qty, ec_order_product.price, ec_order_product.product_name, ec_order_product.product_image, ec_orders.status from ec_orders left join ec_order_product on ec_order_product.order_id = ec_orders.id where user_id = ${uid} order by ec_orders.id desc limit 10 offset ${offset}`
		);

		request(opt2, async (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = await JSON.parse(response.body);

				// console.log(x.length);

				if (x.length >= 1) {
					let opt3 = selectFunction(
						`SELECT COUNT(*) AS totalDataCount FROM (SELECT ec_orders.id as id, ec_order_product.qty, ec_order_product.price, ec_order_product.product_name, ec_order_product.product_image, ec_orders.status FROM ec_orders LEFT JOIN ec_order_product ON ec_order_product.order_id = ec_orders.id WHERE user_id = ${uid}) AS subquery`
					);

					request(opt3, async (error, response) => {
						if (error) throw new Error(error);
						else {
							let z = await JSON.parse(response.body);
							// console.log(z);

							if (z.length >= 1) {
								const totalCount = z[0].totalDataCount;
					 			const pageCount = Math.ceil(totalCount / itemsPerPage);

								return res.render("user/orders", 
									{
										title: "Orders",
										lang: req.lang,
										isAuth: true,
										cart: 0,
										products: x,
										currentPage: page,
							      pageCount: pageCount
									}
								)
							}

							else {
								return res.render("user/orders", 
									{
										title: "Orders",
										lang: req.lang,
										isAuth: true,
										cart: 0,
										products: x,
										currentPage: page,
							      pageCount: 0
									}
								)
							}
						}
					})
				}
				else {
					return res.render("user/orders", 
						{
							title: "Orders",
							lang: req.lang,
							isAuth: true,
							cart: 0,
							products: [],
							currentPage: page,
							pageCount: 0
						}
					)
				}
			}
		})
	}
	catch(error) {
		console.log(error);
		return res.redirect("/");
	}
})

router.get("/v1/faq", async (req, res, next) => {
	try {
		let message = req.flash('error');
		// console.log(message);

		if (message.length > 0) {
			message = message[0];
		}
		else {
			message = null;
		}

		const lang = req.lang.smws.lang;

		// console.log(lang);

		let opt1 = '';

		if (lang == 'en') {
			opt1 = selectFunction("select * from faqs_translations");
		}

		else {
			opt1 = selectFunction("select * from faqs");
		}

		request(opt1, (error, response) => {
			if (error) throw new Error(error);
			else {
				let x = JSON.parse(response.body);

				// console.log(x);

				return res.render('user/faq', 
					{ 
						title: 'FAQ',
						lang: req.lang,
				    errorMessage: message,
						isAuth: false,
						cart: '0',
						data: x
					}
				);
			}
		});
	}
	catch(error) {
		console.log(error);
		return res.redirect("/");
	}
})

router.get("/v1/contactUs", async (req, res, next) => {
	try {
		let message = req.flash('error');
		// console.log(message);

		if (message.length > 0) {
			message = message[0];
		}
		else {
			message = null;
		}

		return res.render('user/contact', 
			{ 
				title: 'Contact',
				lang: req.lang,
				errorMessage: message,
				isAuth: false,
				cart: '0'
			}
		);
	}

	catch(error) {
		console.log(error);
		return res.redirect("/");
	}
})

router.post("/v1/newsLetter",
	[
		body('email')
			.trim()
			.notEmpty()
			.withMessage('Email Address required')
			.normalizeEmail()
			.isEmail()
			.withMessage('Invalid email'),
	],
 	async (req, res, next) => {
		const referer = req.headers.referer;
		try {
			const { email } = req.body;

			const error = validationResult(req);

			if (!error.isEmpty()) {
				// console.log(error.array()[0].msg);
				req.flash('error', error.array()[0].msg);
				return res.redirect(referer);
			}

			else {
				const values1 = `\'${email}\', null, \'subscribed\', null, null`;

				// console.log(values1);

				let opt1 = insertFunction(
					"INSERT INTO newsletters (email, name, status, created_at, updated_at) VALUES ("
						.concat(`${values1}`)
						.concat(")"),
					"select * from newsletters where email = '"
						.concat(`${email}`)
						.concat("'")
				);

				request(opt1, async (error, response) => {
					if (error) throw new Error(error);
					else {
						const x = JSON.parse(response.body);

						console.log(x);

						if (x.length >= 1) {
							return res.redirect(referer);
						}
						else {
				      req.flash('error', "Failed try again...");
							return res.redirect(referer);
						}
					}
				})
			}
		}
		catch(error) {
			console.log(error);
			return res.redirect(referer);
		}
})

module.exports = router;
