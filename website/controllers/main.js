var myApp = angular.module('myApp');

myApp.controller('MainController', function($rootScope, $scope, $http, $location, $routeParams, $timeout, UserService) {
	$scope.errorMessage = '';

	$scope.isLogin = function() {
		if (!UserService.isLogin()) {
			$location.path("/");
		} else {
			return true;
		}
	}

	$scope.createRepository = function() {
		var data = {
			name: $scope.repositoryName
		}
		$http({
			method: 'PUT',
			url: '/api/git/repository/create',
			data: data
		}).then(function successCallback(response) {
			console.log(response);
			if (response.status == 200) {
				if (response.data.code == 200) {
					$location.path("/repository");
				} else {
					$rootScope.$broadcast('errorIn', response.data.result);
				}
			}

			$scope.repositoryName = '';
		}, function errorCallback(error) {
			console.log(error);
			$location.path("/");
		});
	}

	$scope.deleteRepository = function(repository) {
		$http.delete('/api/git/repository/' + repository)
		.then(function successCallback(response) {
			console.log(response);
			if (response.status == 200) {
				if (response.data.code == 200) {
					$scope.getRepositories();
				}
			}
		}, function errorCallback(error) {
			console.log(error);
			$location.path("/");
		});
	}

	$scope.getRepositories = function() {
		$scope.repositoryList = [];
		$http({
			method: 'GET',
			url: '/api/git/repository'
		}).then(function successCallback(response) {
			console.log(response);
			if (response.status == 200) {
				if (response.data.code == 200) {
					console.log(response.data.data);
					var repositories = response.data.data;
					for (var i in repositories) {
						$scope.repositoryList.push({
							name: repositories[i],
							collaboratorList: []
						});
						getCollaborators(i);
					}
				}
			}
		}, function errorCallback(error) {
			console.log(error);
			$location.path("/");
		});
	}

	$scope.createSshKey = function() {
		var data = {
			sshKey: $scope.sshKey,
			keyName: $scope.keyName
		}
		$http({
			method: 'PUT',
			url: '/api/user/ssh_key',
			data: data
		}).then(function successCallback(response) {
			console.log(response);
			if (response.status == 200) {
				if (response.data.code == 200) {
					$location.path("/sshkey");
				} else {
					$rootScope.$broadcast('errorIn', response.data.result);
				}
			}

			$scope.sshKey = '';
			$scope.keyName = '';
		}, function errorCallback(error) {
			console.log(error);
			$location.path("/");
		});
	}

	$scope.deleteSshKey = function(sshKeyName) {
		$http.delete('/api/user/ssh_key/' + sshKeyName)
		.then(function successCallback(response) {
			console.log(response);
			if (response.status == 200) {
				if (response.data.code == 200) {
					UserService.setUserData(response.data.data);
				}
			}			
		}, function errorCallback(error) {
			console.log(error);
			$location.path("/");
		});
	}

	$scope.getSshKeys = function() {
		$http({
			method: 'GET',
			url: '/api/user/'
		}).then(function successCallback(response) {
			console.log(response);
			if (response.status == 200) {
				UserService.setUserData(response.data);
				$scope.sshKeyList = UserService.getSshKeys();
			} else {
				$location.path("/");
			}
		}, function errorCallback(error) {
			console.log(error);
			$location.path("/");
		});
	}

	$scope.login = function() {
		var data = {
			username: $scope.username,
			password: $scope.password,
		}
		console.log(data);
		$http({
			method: 'POST',
			url: '/api/user/signin',
			data: data
		}).then(function successCallback(response) {
			console.log(response);
			if (response.status == 200) {
				if (response.data.code == 200) {
					UserService.setUserData(response.data.data);
					$location.path("/repository");
				}
			}

			$scope.username = '';
			$scope.password = '';
		}, function errorCallback(error) {
			console.log(error);
			$location.path("/");
		});
	}

	$scope.signup = function() {
		var data = {
			username: $scope.username,
			password: $scope.password
		}
		$http({
			method: 'POST',
			url: '/api/user/signup',
			data: data
		}).then(function successCallback(response) {
			console.log(response);
			if (response.status == 200) {
				if (response.data.code == 200) {
					UserService.setUserData(response.data.data);
					$location.path("/repository");
				} else {
					$scope.errorMessage = response.data.result;
					$scope.isNotMatch = true;
					$scope.usernameClass = 'invalid-form';
					$scope.passwordClass = 'invalid-form';
					$scope.checkPasswordClass = 'invalid-form';
				}
			}

			$scope.username = '';
			$scope.password = '';
			$scope.checkPassword = '';
		}, function errorCallback(error) {
			console.log(error);
			$location.path("/");
		})
	}

	$scope.redirectTo = function(path) {
		console.log(path);
		$location.path(path);
	}

	// Receiver
	$scope.$on('errorIn', function(event, message){
		$timeout(function(){
			$scope.$apply(function(){
				$scope.errorMessage = message;
			});
		});
	});

	// Subscribes
	UserService.subscribeUserChange($scope, function changeUser() {
		$scope.sshKeyList = UserService.getSshKeys();
	});

	// Inner functions
	var getCollaborators = function(index) {
		var repository = $scope.repositoryList[index].name;
		$http({
			method: 'GET',
			url: '/api/git/repository/' + repository + '/collaborator'
		}).then(function successCallback(response) {
			console.log(response);
			if (response.status == 200) {
				if (response.data.code == 200) {
					console.log();
					$scope.repositoryList[index].collaboratorList = response.data.data;
				}
			}
		}, function errorCallback(error) {
			console.log(error);
			$location.path("/");
		});
	}
});