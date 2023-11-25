const express = require('express');

const { body, validationResult } = require('express-validator');

const request = require('request');

const router = express.Router();

const baseUrl = "https://bhaveshnetflix.live/web_api/";

const isAuth = require('../middleware/is_auth');

let selectFunction = (item) => {
  let options = {
    method: "POST",
    url: baseUrl + "select.php",
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

let loginFunction = (item, item2) => {
  let options = {
    method: "POST",
    url: baseUrl + "website_login.php",
    formData: {
	    'email': item,
    	'password': item2,
  	},
  };
  return options;
};

let registerFunction = (item, item2, item3) => {
  let options = {
    method: "POST",
    url: baseUrl + "register.php",
    formData: {
	    'email': item,
    	'password': item2,
    	'name': item3,
  	},
  };
  return options;
};

function qwerty() {
	const fonts = ["cursive", "sans-serif", "serif", "monospace"];

	let captchaValue = '';

	function generateCaptcha() {
		let value = btoa(Math.random()*1000000000);
		value = value.substr(0, 5+Math.random()*5);
		captchaValue = value;
		return captchaValue;
	}

	function setCaptcha() {
		const abcd = captchaValue.split("").map((char) => {
			const rotate = -20 + Math.trunc(Math.random()*30);
			const font = Math.trunc(Math.random() * fonts.length);

			// console.log(rotate, font, char);
			return {
				rotate: rotate,
				font: fonts[font],
				char: char
			}
		});

		// console.log(abcd);
		return abcd;
	}

	const x = generateCaptcha();
	const y = setCaptcha();

	return {x,y};
}

router.post('/language', async (req, res, next) =>{
	const { lang } = req.body;

	// res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000 });

	req.session.lang = lang;

	const email = req.session.user;

	let opt1 = updateFunction(
		"update hSession set lang = '"
			.concat(`${lang}`)
			.concat("' where email = '")
			.concat(`${email}`)
			.concat("'"),
		"select * from hSession where email = '"
			.concat(`${email}`)
			.concat("'")
	);

	request(opt1, async (error, response) => {
		if (error) throw new Error(error);
		else {
			let x = JSON.parse(response.body);

			// console.log(x);
			// console.log(req.session);

			const referer = req.headers.referer;

			return res.redirect(referer);
		}
	})
});

router.get('/login', async (req, res, next) => {
	const {x,y} = qwerty();

	// console.log(x,y);

	let message = req.flash('error');
	// console.log(message);

	if (message.length > 0) {
		message = message[0];
	}
	else {
		message = null;
	}

	return res.render('auth/login', 
		{ 
			title: 'Login',
			lang: req.lang,
			data1: x,
			data2: y,
	    errorMessage: message,
			isAuth: false,
			cart: '0',
			oldInput: {
				email: ''
			} 
		}
	);
});

router.get('/register', async (req, res, next) => {
	let message = req.flash('error');
	// console.log(message);

	if (message.length > 0) {
		message = message[0];
	}
	else {
		message = null;
	}

	return res.render('auth/register', 
		{ 
			title: 'Register',
			lang: req.lang,
	    errorMessage: message,
	    isAuth: false,
			cart: '0',
			oldInput: {
				email: '',
				telegram: '',
			} 
		}
	);
});

router.post('/login',
	[
		body('email')
			.trim()
			.notEmpty()
			.withMessage('Email Address required')
			.normalizeEmail()
			.isEmail()
			.withMessage('Invalid email or password'),
		body('password')
			.trim()
			.notEmpty()
			.withMessage('Password required')
			.isLength({min: 8})
			.withMessage('Password must be 8 characters long')
			.matches(/(?=.*?[A-Z])/).withMessage('Password must have at least one Uppercase')
  			.matches(/(?=.*?[a-z])/).withMessage('Password must have at least one Lowercase')
  			.matches(/(?=.*?[0-9])/).withMessage('Password must have at least one Number')
  			.matches(/(?=.*?[#?!@$%^&*-])/).withMessage('Password must have at least one special character')
  			.not().matches(/^$|\s+/).withMessage('White space not allowed'),
  	body('captcha')
  		.trim()
  		.notEmpty()
  		.withMessage('Captcha required')
	],
	async (req, res, next) => {
		const { email, password } = req.body;

		// console.log(req.body);

		try {
			const {x,y} = qwerty();

			const error = validationResult(req);

			if (!error.isEmpty()) {
				// console.log(error.array());
				return res.render("auth/login", 
			    { 
						title: 'Login',
			      lang: req.lang,
			      errorMessage: error.array()[0].msg,
			      data1: x,
						data2: y,
						isAuth: false,
						cart: '0',
			      oldInput: {
			      	email: email
			      }
			    }
			  );
			}

			else {
				let opt1 = loginFunction(
					`${email}`,
					`${password}`
				);

				request(opt1, async (error, response) => {
					if (error) throw new Error(error);
					else {
						let x = JSON.parse(response.body);

						// console.log(x, x.isSuccess);

						if (x.isSuccess == false) {
							req.flash('error', 'Invalid email or password...');
							return res.redirect("/v1/login");
						}

						else {
							const lang = req.lang.smws.lang;

							function random() {
							  let num = '';
							  for (let i = 0; i < 5; i++) {
							    num += Math.floor(Math.random() * 10);
							  }
							  return num;
							}

							const array = [
								{ lang: 'en',
									msg: "Do not share it with anyone, even if they claim to work for H4KIG. This code can only be used to log in to your app. We will never ask you for it for any other purpose. If you didn't request this code while trying to log in from another device, you can ignore this message. Check spam folder in gmail." },
								{ lang: 'fr',
									msg: "Ne le communiquez à personne, même si quelqu'un prétend être un employé de H4KIG. Ce code est uniquement destiné à être utilisé pour vous connecter à votre application. Nous ne vous le demanderons jamais pour d'autres raisons. Si vous n'avez pas demandé ce code en essayant de vous connecter depuis un autre appareil, vous pouvez ignorer ce message. Vérifiez le dossier spam dans Gmail." }
							];

							let msgBody = '';

							let rNumber = '';
							rNumber = random();
							console.log(rNumber);

							if (lang === array[1].lang) {
								msgBody = `Code de connexion : ${rNumber}. ${array[1].msg}`;
							}
							else if (lang === array[0].lang) {
								msgBody = `Connection Code : ${rNumber}. ${array[0].msg}`;
							}

							// console.log(msgBody);

					    const opt2 = {
							  'method': 'POST',
							  'url': 'https://bhaveshnetflix.live/sendMail.php',
							  'headers': {
							    'Content-Type': 'application/x-www-form-urlencoded'
							  },
							  form: {
							    'receiver': email,
							    'subject': 'Hi,',
							    'msg': msgBody
							  }
							};

							request(opt2, function (error, response) {
								if (error) throw new Error(error);
								else {
									let y = response.body;
									// console.log(y, typeof y);

									if (y === 'Sent') {
										// insert otp into database

							      const opt3 = updateFunction(
							      		"update ec_customers set email_verify_token = '"
							      		.concat(`${rNumber}`)
							      		.concat("' where email = '")
							      		.concat(`${email}`)
							      		.concat("'"),
							      		"select * from ec_customers where email = '"
												.concat(`${email}`)
												.concat("' limit 10 offset 0")
							      )

							      // console.log(opt3);

							      request(opt3, (error, response) => {
							      		if (error) throw new Error(error);
										   	else {
										      let z = JSON.parse(response.body);

										      // console.log(z, email);

										      if (z.length >= 1) {
														res.cookie('email', email);										      	
										      	req.session.user = email;
										      	return res.redirect('/v1/verifyMe');
										      }
										      else {
										      	req.flash('error', 'Invalid email...');
														return res.redirect("/v1/login");
										      }
										    }
							      })
							  	}

							  	else {
							  		req.flash('error', 'Error sending OPT....');
										return res.redirect("/v1/login");
							  	}
							  }
							})
						}
					}
				})
			}
		}

		catch(error) {
			console.log(error);
			return res.redirect("/v1/login");
		}
	}
);

router.post('/register',
	[
	  body('email')
			.trim()
			.notEmpty()
			.withMessage('Email Address required')
			.normalizeEmail()
			.isEmail()
			.withMessage('Invalid email'),
		body('telegram')
			.trim()
			.notEmpty()
			.withMessage('Name required'),
		body('password')
			.trim()
			.notEmpty()
			.withMessage('Password required')
			.isLength({min: 8})
			.withMessage('Password must be 8 characters long')
			.matches(/(?=.*?[A-Z])/).withMessage('At least one Uppercase')
  		.matches(/(?=.*?[a-z])/).withMessage('At least one Lowercase')
  		.matches(/(?=.*?[0-9])/).withMessage('At least one Number')
  		.matches(/(?=.*?[#?!@$%^&*-])/).withMessage('At least one special character')
  		.not().matches(/^$|\s+/).withMessage('White space not allowed'),
	  body('cpassword')
	  	.notEmpty()
		  .withMessage('Confirm password is required')
		  .custom((value, { req }) => {
		    if (value !== req.body.password) {
		      throw new Error('Passwords do not match');
		    }
		    return true;
			}),
	],
	async (req, res, next) => {
		const { email, password, cpassword, telegram } = req.body;

		// console.log(req.body);

		try {

			const error = validationResult(req);

			if (!error.isEmpty()) {
				// console.log(error.array());
				return res.render("auth/register", 
			    { 
						title: 'Register',
			      lang: req.lang,
			      errorMessage: error.array()[0].msg,
			      isAuth: false,
			      cart: '0',
			      oldInput: {
			      	email: email,
			      	telegram: telegram
			      }
			    }
			  );
			}

			else {
				let opt1 = registerFunction(
					`${email}`,
					`${password}`,
					`${telegram}`
				);

				request(opt1, async (error, response) => {
					if (error) throw new Error(error);
					else {
						let x = JSON.parse(response.body);

						// console.log(x);

						if (x.isSuccess == false) {
							req.flash('error', 'Email already exists...');
							return res.redirect('/v1/register');
						}

						else {
					   	const lang = req.lang.smws.lang;

							function random() {
								let num = '';
								for (let i = 0; i < 5; i++) {
								  num += Math.floor(Math.random() * 10);
								}
								return num;
							}

							const array = [
								{ lang: 'en',
									msg: "Do not share it with anyone, even if they claim to work for H4KIG. This code can only be used to log in to your app. We will never ask you for it for any other purpose. If you didn't request this code while trying to log in from another device, you can ignore this message. Check spam folder in gmail." 
								},
								{ lang: 'fr',
									msg: "Ne le communiquez à personne, même si quelqu'un prétend être un employé de H4KIG. Ce code est uniquement destiné à être utilisé pour vous connecter à votre application. Nous ne vous le demanderons jamais pour d'autres raisons. Si vous n'avez pas demandé ce code en essayant de vous connecter depuis un autre appareil, vous pouvez ignorer ce message. Vérifiez le dossier spam dans Gmail." 
								}
							];

							let msgBody = '';

							let rNumber = '';
							rNumber = random();
							console.log(rNumber);

							if (lang === array[1].lang) {
								msgBody = `Code de connexion : ${rNumber}. ${array[1].msg}`;
							}
							else if (lang === array[0].lang) {
								msgBody = `Connection Code : ${rNumber}. ${array[0].msg}`;
							}

							const opt2 = {
							  'method': 'POST',
							  'url': 'https://bhaveshnetflix.live/sendMail.php',
							  'headers': {
							    'Content-Type': 'application/x-www-form-urlencoded'
							  },
							  form: {
							    'receiver': email,
							    'subject': 'Hi,',
							    'msg': msgBody
							  }
							};

							request(opt2, function (error, response) {
								if (error) throw new Error(error);
								else {
									let y = response.body;
									// console.log(y, typeof y);

									if (y === 'Sent') {
										const opt3 = updateFunction(
										  "update ec_customers set email_verify_token = '"
										    .concat(`${rNumber}`)
										    .concat("' where email = '")
										    .concat(`${email}`)
										    .concat("'"),
										  "select * from ec_customers where email = '"
												.concat(`${email}`)
												.concat("' limit 10 offset 0")
										)

										// console.log(opt3);

										request(opt3, (error, response) => {
										  if (error) throw new Error(error);
											else {
											  let z = JSON.parse(response.body);

											  // console.log(z);

											  if (z.length >= 1) {
											    res.cookie('email', email);										      	
											   	req.session.user = email;
											   	return res.redirect('/v1/verifyMe');
											  }
											  else {
											   	req.flash('error', 'Invalid email...');
													return res.redirect("/v1/register");
											  }
											}
										})
									}

									else {
							  		req.flash('error', 'Error sending OPT....');
										return res.redirect("/v1/register");
							  	}
								}
							})
						}
					}
				})
			}
		}

		catch(error) {
			console.log(error);
			return res.redirect("/v1/register");
		}
	}
);

router.get('/verifyMe', async (req, res, next) => {
	let message = req.flash('error');
	// console.log(message);

	if (message.length > 0) {
		message = message[0];
	}
	else {
		message = null;
	}

	return res.render('auth/verify', 
		{ 
			title: 'VerifyMe',
			lang: req.lang,
	    errorMessage: message,
	    isAuth: false,
	    cart: '0',
			oldInput: {
				number: ''
			} 
		}
	);
})

router.post('/verifyMe', isAuth,
	[
		body('number')
			.trim()
			.notEmpty()
			.withMessage('OTP required')
			.isLength({max: 5})
			.withMessage('contains 5 numbers only')
			.matches(/^[0-9]+$/)
			.withMessage('must be a valid otp'),
	],
	async (req, res, next) => {
		const otp = req.body.number;
		// console.log(otp);

		try {
			const error = validationResult(req);

			if (!error.isEmpty()) {
				// console.log(error.array());
				return res.render('auth/verify', 
					{ 
						title: 'VerifyMe',
						lang: req.lang,
			      errorMessage: message,
			      isAuth: false,
			      cart: '0',
						oldInput: {
							number: number
						} 
					}
				)
			}

			else {
			  const email = req.session.user;
				const lang = req.session.lang;
				// console.log(req.session.user == '');
				// console.log(email, lang);
				
				let opt1 = selectFunction(
					"select email_verify_token from ec_customers where email = '"
						.concat(`${email}`)
						.concat("' limit 10 offset 0")
				);

				request(opt1, (error, response) => {
					if (error) throw new Error(error);
					else {
						let x = JSON.parse(response.body);

						// console.log(x);

						if (x.length >= 1) {
							const number = x[0].email_verify_token;

							const currentDate = new Date();

							const subDate = currentDate.toISOString().slice(0, 19).replace('T', ' ');

							// console.log(subDate);

							// console.log(typeof otp, typeof number, Number(number) == Number(otp));

							if (number !== null && number !== '' && Number(number) == Number(otp)) {
								let opt2 = updateFunction(
									"update ec_customers set email_verify_token = 'null', status = 'activated', confirmed_at = '"
										.concat(`${subDate}`)
										.concat("' where email = '")
                    .concat(`${email}`)
                    .concat("'"),
                  "select * from ec_customers where email = '"
                    .concat(`${email}`)
                    .concat("' limit 10 offset 0")
								);

								request(opt2, (error, response) => {
									if (error) throw new Error(error);
									else {
										let y = JSON.parse(response.body);

										// console.log(y, email, lang);

										if (y.length >= 1) {
											let values2 = `\'${email}\', \'true\', \'${lang}\'`;

								    	let opt3 = insertFunction(
								    		"insert into hSession (email, isLoggedIn, lang) values ("
								    		.concat(`${values2}`)
								    		.concat(")"),
								    		"select * from hSession where email = '"
								    		.concat(`${email}`)
								    		.concat("'")
								    	);

								    	request(opt3, (error, response) => {
								    		if (error) throw new Error(error);
												else {
													let z = JSON.parse(response.body);
													// console.log(z);

													// res.cookie('isLoggedIn', true, { maxAge: 365 * 24 * 60 * 60 * 1000 });										      	
													
													req.session.user = email;
													req.session.isLoggedIn = true;
													req.session.lang = lang;
													req.session.save(err => {
														if(!err) {
															return res.redirect('/');
														}
													})
												}
								    	})
										}

										else {
											req.flash('error', 'Failed to update otp...');
											return res.redirect("/v1/verifyMe");
										}
									}
								})
							}

							else {
								req.flash('error', 'Invalid OTP, Try Again...');
								return res.redirect("/v1/verifyMe");
							}
						}

						else {
							req.flash('error', 'Invalid OTP, Try Again...');
							return res.redirect("/v1/verifyMe");
						}
					}
				})
			}
		}

		catch(error) {
			req.flash('error', 'Invalid OTP, Try Again...');
			return res.redirect("/v1/verifyMe");
		}
	}
)

router.get("/logout", async (req, res, next) => {
 req.session.destroy((err) => {
    // console.log(err);
    // res.clearCookie('lang');
    res.clearCookie('email');
    // res.clearCookie('isLoggedIn');
    return res.redirect('/');
  });
})


// router.get('/index', (req, res, next) => {
//   const user = req.session.user;
//   const lang = req.session.lang;
//   const data = req.cookies.lang;
  
//   return res.send(`User: ${user}, Language: ${lang}, data1: ${data}`);
// })

module.exports = router;
