var myApp = angular.module('myApp', ['ngRoute'])

myApp.config(function($routeProvider) {
	$routeProvider.when('/', {
		controller: 'MainController',
		templateUrl: 'views/index.html',
		resolve: {
			data: function (ViewService, UserService) {
				return ViewService.setView(1)
			}
		}
	})
	.when('/signin', {
		controller: 'MainController',
		templateUrl: 'views/index.html',
		resolve: {
			data: function (ViewService, UserService) {
				return ViewService.setView(1)
			}
		}
	})
	.when('/signup', {
		controller: 'MainController',
		templateUrl: 'views/signup.html',
		resolve: {
			data: function (ViewService, UserService) {
				return ViewService.setView(2)
			}
		}
	})
	.when('/repository', {
		controller: 'MainController',
		templateUrl: 'views/repository.html',
		resolve: {
			data: function (ViewService, UserService) {
				UserService.getUser()
				return ViewService.setView(3)
			}
		}
	})
	.when('/repository/create', {
		controller: 'MainController',
		templateUrl: 'views/create_repository.html',
		resolve: {
			data: function (ViewService, UserService) {
				UserService.getUser()
				return ViewService.setView(3)
			}
		}
	})
	.when('/repository/:repositoryName', {
		controller: 'MainController',
		templateUrl: 'views/view_repository.html',
		resolve: {
			data: function (ViewService, UserService) {
				UserService.getUser()
				return ViewService.setView(3)
			}
		}
	})
	.when('/repository/:repositoryName/:ref/:head/:branch', {
		controller: 'MainController',
		templateUrl: 'views/view_repository.html',
		resolve: {
			data: function (ViewService, UserService) {
				UserService.getUser()
				return ViewService.setView(3)
			}
		}
	})
	.when('/sshkey', {
		controller: 'MainController',
		templateUrl: 'views/sshkey.html',
		resolve: {
			data: function (ViewService, UserService) {
				UserService.getUser()
				return ViewService.setView(4)
			}
		}
	})
	.when('/sshkey/create', {
		controller: 'MainController',
		templateUrl: 'views/create_sshkey.html',
		resolve: {
			data: function (ViewService, UserService) {
				UserService.getUser()
				return ViewService.setView(4)
			}
		}
	})
	.when('/settings', {
		controller: 'MainController',
		templateUrl: 'views/settings.html',
		resolve: {
			data: function (ViewService, UserService) {
				UserService.getUser()
				return ViewService.setView(5)
			}
		}
	})
	.otherwise({
		redirectTo: '/',
		templateUrl: 'views/index.html',
		resolve: {
			data: function (ViewService, UserService) {
				return ViewService.setView(1)
			}
		}
	})
})

myApp.directive('ngConfirmClick', [
	function(){
		return {
			link: function (scope, element, attr) {
				var msg = attr.ngConfirmClick || "Are you sure?"
				var clickAction = attr.confirmedClick
				element.bind('click',function (event) {
					if ( window.confirm(msg) ) {
						scope.$eval(clickAction)
					}
				})
			}
		}
	}])
myApp.directive('ngCheckSignupData', [
	function(){
		return {
			link: function (scope, elem, attrs, ctrl) {
				var username = '#inputUsername'
				var firstPassword = '#inputPassword'
				var checkPassword = '#inputCheckPassword'

				elem.on('keyup', function () {
					scope.$apply(function () {
						var currentComponent = '#' + attrs.ngCheckSignupData
						var minNumOfChars = 6

						scope.isNotMatch = true
						scope.usernameClass = 'valid-form'
						scope.passwordClass = 'valid-form'
						scope.checkPasswordClass = 'valid-form'
						// Check length
						if ($(username).val().length < minNumOfChars) {
							if (currentComponent == username) scope.errorMessage = 'The username must be at least 6 characters.'
							scope.usernameClass = 'invalid-form'
						} else {
							if (currentComponent == username) scope.errorMessage = ''
						}
						if ($(firstPassword).val().length < minNumOfChars) {
							if (currentComponent == firstPassword) scope.errorMessage = 'The password must be at least 6 characters.'
							scope.passwordClass = 'invalid-form'
						} else {
							if (currentComponent == firstPassword) scope.errorMessage = ''
						}
						
						// Check special characters
						var regularExpression = /^[a-zA-Z0-9!@#$%^&*]{6,16}$/
						if(!regularExpression.test($(firstPassword).val())) {
							if (currentComponent == firstPassword && scope.errorMessage.length == 0) scope.errorMessage = 'The password should not contain some special character.'
							scope.passwordClass = 'invalid-form'
						} else {
							if (currentComponent == firstPassword) scope.errorMessage = ''
						}

						// Check is the password matched?
						if (scope.errorMessage.length == 0) {
							if ($(firstPassword).val() !== $(checkPassword).val()) {
								scope.errorMessage = 'The password did not match.'
								scope.checkPasswordClass = 'invalid-form'
							} else {
								scope.errorMessage = ''
								scope.isNotMatch = false
							}
						}
					})
				})
			}
		}
	}])
myApp.directive('ngCheckSshData', [
	function(){
		return {
			link: function (scope, elem, attrs, ctrl) {
				var keyName = '#inputKeyName'
				var sshKey = '#inputSshKey'
				elem.on('keyup', function () {
					scope.$apply(function () {
						var currentComponent = '#' + attrs.ngCheckSshData

						scope.errorMessage = ''
						scope.isOK = false
						scope.keyNameClass = 'valid-form'
						scope.sshKeyClass = 'valid-form'
						if($(keyName).val().length > 0) {
							// Check special characters
							var regularExpression = /^[a-zA-Z0-9_-]{1,16}$/
							if(!regularExpression.test($(keyName).val())) {
								if (currentComponent == keyName) scope.errorMessage = 'Key name can not contain special character.'
								scope.keyNameClass = 'invalid-form'
							}
						}

						var sshRegularExpression = /ssh-rsa AAAA[0-9A-Za-z+/]+[=]{0,3} ([^@]+@[^@]+)/
						if(!sshRegularExpression.test($(sshKey).val())) {
							if (currentComponent == sshKey) scope.errorMessage = 'SSH key format error.'
							scope.sshKeyClass = 'invalid-form'
						} else {
							if($(keyName).val().length > 0 && scope.errorMessage.length == 0) {
								scope.isOK = true
							}
						}
					})
				})
			}
		}
	}])
myApp.directive('ngCheckUpdatePassword', [
	function(){
		return {
			link: function (scope, elem, attrs, ctrl) {
				var newPassword = '#newPassword'
				var confirmPassword = '#confirmPassword'
				elem.on('keyup', function () {
					scope.$apply(function () {
						var currentComponent = '#' + attrs.ngCheckUpdatePassword
						var minNumOfChars = 6

						scope.errorMessage = ''
						scope.isNotMatch = true
						scope.newPasswordClass = 'valid-form'
						scope.confirmPasswordClass = 'valid-form'

						// Check length
						if ($(newPassword).val().length < minNumOfChars) {
							if (currentComponent == newPassword) scope.errorMessage = 'The password must be at least 6 characters.'
							scope.newPasswordClass = 'invalid-form'
						} else {
							if (currentComponent == newPassword) scope.errorMessage = ''
						}

						// Check special characters
						var regularExpression = /^[a-zA-Z0-9!@#$%^&*]{6,16}$/
						if(!regularExpression.test($(newPassword).val())) {
							if (currentComponent == newPassword && scope.errorMessage.length == 0) scope.errorMessage = 'The password should not contain some special character.'
							scope.newPasswordClass = 'invalid-form'
						} else {
							if (currentComponent == newPassword) scope.errorMessage = ''
						}

						// Check is the password matched?
						if (scope.errorMessage.length == 0) {
							if ($(newPassword).val() !== $(confirmPassword).val()) {
								scope.errorMessage = 'The password did not match.'
								scope.confirmPasswordClass = 'invalid-form'
							} else {
								scope.errorMessage = ''
								scope.isNotMatch = false
							}
						}
						console.log(scope.errorMessage)
					})
				})
			}
		}
	}])
myApp.directive('ngCheckNormalData', [
	function(){
		return {
			link: function (scope, elem, attrs, ctrl) {
				var data = '#' + attrs.ngCheckNormalData
				elem.on('keyup', function () {
					scope.$apply(function () {
						scope.errorMessage = ''
						scope.isOK = false
						scope.dataClass = 'valid-form'
						if($(data).val().length > 0) {
							// Check special characters
							var regularExpression = /^[a-zA-Z0-9_-]{1,}$/
							if(!regularExpression.test($(data).val())) {
								scope.errorMessage = 'Should not contain special character.'
								scope.dataClass = 'invalid-form'
							} else {
								scope.isOK = true
							}
						}
					})
				})
			}
		}
	}])
