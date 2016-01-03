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