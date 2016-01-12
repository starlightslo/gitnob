var myApp = angular.module('myApp')

myApp.controller('NavController', function($rootScope, $scope, $http, $location, $routeParams, UserService, ViewService) {
	$scope.username = ''

	$scope.isLogin = function() {
		return UserService.isLogin()
	}

	$scope.getView = function() {
		return ViewService.getView()
	}

	$scope.setView = function(view) {
		ViewService.setView(view)
		updateViewClass()
	}

	$scope.updateViewClass = function() {
		updateViewClass()
	}

	$scope.logout = function() {
		UserService.clearUser()
		$http({
			method: 'POST',
			url: '/api/user/logout'
		}).then(function successCallback(response) {
			$location.path("/")
		}, function errorCallback(error) {
			$location.path("/")
		})
	}

	// Subscribes
	ViewService.subscribeViewChange($scope, function changeView() {
		updateViewClass()
	})
	UserService.subscribeUserChange($scope, function changeUser() {
		updateViewClass()
		$scope.username = UserService.getUsername()
	})

	// Inner functions
	var updateViewClass = function() {
		$scope.signinClass = ViewService.isSignin()
		$scope.signupClass = ViewService.isSignup()
		$scope.repositoryClass = ViewService.isRespository()
		$scope.sshkeyClass = ViewService.isSshKey()
		$scope.settingsClass = ViewService.isSettings()
		if (UserService.isLogin()) {
			$scope.navbarClass = {display: 'block'}
			$scope.loginNavbarClass = {display: 'none'}
			$scope.memberNavbarClass = {display: 'block'}
		} else {
			$scope.navbarClass = {display: 'none'}
			$scope.loginNavbarClass = {display: 'block'}
			$scope.memberNavbarClass = {display: 'none'}
		}
	}

})