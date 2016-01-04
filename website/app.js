var myApp = angular.module('myApp', ['ngRoute']);

myApp.config(function($routeProvider) {
	$routeProvider.when('/', {
		controller: 'MainController',
		templateUrl: 'views/index.html',
		resolve: {
			data: function (ViewService, UserService) {
				return ViewService.setView(1);
			}
		}
	})
	.when('/signin', {
		controller: 'MainController',
		templateUrl: 'views/index.html',
		resolve: {
			data: function (ViewService, UserService) {
				return ViewService.setView(1);
			}
		}
	})
	.when('/signup', {
		controller: 'MainController',
		templateUrl: 'views/signup.html',
		resolve: {
			data: function (ViewService, UserService) {
				return ViewService.setView(2);
			}
		}
	})
	.when('/repository', {
		controller: 'MainController',
		templateUrl: 'views/repository.html',
		resolve: {
			data: function (ViewService, UserService) {
				UserService.getUser();
				return ViewService.setView(3);
			}
		}
	})
	.when('/repository/create', {
		controller: 'MainController',
		templateUrl: 'views/create_repository.html',
		resolve: {
			data: function (ViewService, UserService) {
				UserService.getUser();
				return ViewService.setView(3);
			}
		}
	})
	.when('/sshkey', {
		controller: 'MainController',
		templateUrl: 'views/sshkey.html',
		resolve: {
			data: function (ViewService, UserService) {
				UserService.getUser();
				return ViewService.setView(4);
			}
		}
	})
	.when('/sshkey/create', {
		controller: 'MainController',
		templateUrl: 'views/create_sshkey.html',
		resolve: {
			data: function (ViewService, UserService) {
				UserService.getUser();
				return ViewService.setView(4);
			}
		}
	})
	.when('/settings', {
		controller: 'MainController',
		templateUrl: 'views/settings.html',
		resolve: {
			data: function (ViewService, UserService) {
				UserService.getUser();
				return ViewService.setView(5);
			}
		}
	})
	.otherwise({
		redirectTo: '/',
		templateUrl: 'views/index.html',
		resolve: {
			data: function (ViewService, UserService) {
				return ViewService.setView(1);
			}
		}
	})
});

myApp.directive('ngConfirmClick', [
	function(){
		return {
			link: function (scope, element, attr) {
				var msg = attr.ngConfirmClick || "Are you sure?";
				var clickAction = attr.confirmedClick;
				element.bind('click',function (event) {
					if ( window.confirm(msg) ) {
						scope.$eval(clickAction)
					}
				});
			}
		};
	}])
myApp.directive('ngCheckSignupData', [
	function(){
		return {
			link: function (scope, elem, attrs, ctrl) {
				var username = '#inputUsername';
				var firstPassword = '#inputPassword';
				var checkPassword = '#inputCheckPassword';

				elem.on('keyup', function () {
					scope.$apply(function () {
						var currentComponent = '#' + attrs.ngCheckSignupData;
						var minNumOfChars = 6;

						scope.isNotMatch = true;
						scope.usernameClass = 'valid-form';
						scope.passwordClass = 'valid-form';
						scope.checkPasswordClass = 'valid-form';
						// Check length
						if ($(username).val().length < minNumOfChars) {
							if (currentComponent == username) scope.errorMessage = 'The username must be at least 6 characters.';
							scope.usernameClass = 'invalid-form';
						} else {
							if (currentComponent == username) scope.errorMessage = '';
						}
						if ($(firstPassword).val().length < minNumOfChars) {
							if (currentComponent == firstPassword) scope.errorMessage = 'The password must be at least 6 characters.';
							scope.passwordClass = 'invalid-form';
						} else {
							if (currentComponent == firstPassword) scope.errorMessage = '';
						}
						
						// Check special characters
						var regularExpression = /^[a-zA-Z0-9!@#$%^&*]{6,16}$/;
						if(!regularExpression.test($(firstPassword).val())) {
							if (currentComponent == firstPassword && scope.errorMessage.length == 0) scope.errorMessage = 'The password should not contain some special character.';
							scope.passwordClass = 'invalid-form';
						} else {
							if (currentComponent == firstPassword) scope.errorMessage = '';
						}

						// Check is the password matched?
						if (scope.errorMessage.length == 0) {
							if ($(firstPassword).val() !== $(checkPassword).val()) {
								if (currentComponent == checkPassword) scope.errorMessage = 'The password did not match.';
								scope.checkPasswordClass = 'invalid-form';
							} else {
								if (currentComponent == checkPassword) scope.errorMessage = '';
								scope.isNotMatch = false;
							}
						}
					});
				});
			}
		};
	}])
