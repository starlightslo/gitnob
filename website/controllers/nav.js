var myApp = angular.module('myApp');

myApp.controller('NavController', function($rootScope, $scope, $http, $location, $routeParams, UserService, ViewService) {

	$scope.isLogin = function() {
		return UserService.isLogin();
	}

	$scope.getView = function() {
		return ViewService.getView();
	}

	$scope.setView = function(view) {
		ViewService.setView(view);
		updateViewClass();
	}

	$scope.showNavbar = function() {
		if (this.isLogin()) {
			return {display: 'block'};
		} else {
			return {display: 'none'};
		}
	}

	$scope.showLoginNavbar = function() {
		if (this.isLogin()) {
			return {display: 'none'};
		} else {
			return {display: 'block'};
		}
	}

	// Subscribes
	ViewService.subscribeViewChange($scope, function changeView() {
        updateViewClass();
    });

	// Inner functions
	var updateViewClass = function() {
		$scope.signinClass = ViewService.isSignin();
		$scope.signupClass = ViewService.isSignup();
	}

});