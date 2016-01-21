var myApp = angular.module('myApp')

myApp.controller('MainController', function($rootScope, $scope, $http, $location, $routeParams, $timeout, UserService, GitService) {
	$scope.errorMessage = ''

	const REPOSITORY_TAB = 'repository'
	const RELEASES_TAB = 'releases'
	const CONTRIBUTOR_TAB = 'controbutor'

	// Set default tab
	$scope.tab = REPOSITORY_TAB

	$scope.isLogin = function() {
		if (!UserService.isLogin()) {
			$location.path("/")
		} else {
			return true
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
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					$location.path("/repository")
				} else {
					$rootScope.$broadcast('errorIn', response.data.result)
				}
			}

			$scope.repositoryName = ''
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.deleteRepository = function(repository) {
		$http.delete('/api/git/repository/' + repository)
		.then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					$scope.getRepositories()
				}
			}
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.getRepositories = function() {
		$scope.repositoryList = []
		$http({
			method: 'GET',
			url: '/api/git/repository'
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					var repositories = response.data.data
					for (var i in repositories) {
						$scope.repositoryList.push({
							name: repositories[i],
							collaboratorList: []
						})
						getCollaborators(i)
					}
				}
			}
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.getRepository = function() {
		console.log($routeParams.repositoryName)
		console.log($routeParams.ref)
		console.log($routeParams.head)
		console.log($routeParams.branch)
		var repositoryName = $routeParams.repositoryName
		var currentBranch = ""
		var url = '/api/git/repository/' + repositoryName
		if ($routeParams.ref && $routeParams.head && $routeParams.branch) {
			currentBranch = $routeParams.ref + '/' + $routeParams.head + '/' + $routeParams.branch
			url = url + '/' + currentBranch
		}
		$http({
			method: 'GET',
			url: url
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					GitService.setGitData(repositoryName, response.data.data)
					if (currentBranch.length > 0) {
						GitService.setCurrentBranch(currentBranch)
					}
				}
			}
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})

		// Get collaborator
		$http({
			method: 'GET',
			url: '/api/git/repository/' + repositoryName + '/collaborator'
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					GitService.setCollaboratorList(response.data.data)
				}
			}
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.addCollaborator = function() {
		console.log($scope.newCollaborator)
		if (!$scope.newCollaborator || $scope.newCollaborator.length == 0) return

		var data = {
			username: $scope.newCollaborator
		}
		$http({
			method: 'PUT',
			url: '/api/git/repository/' + $routeParams.repositoryName + '/collaborator',
			data: data
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					$scope.getRepository()
					$scope.errorMessage = 'username...'
					$scope.newCollaboratorClass = ''
				} else {
					$scope.errorMessage = response.data.result
					$scope.newCollaboratorClass = 'invalid-form'
				}
			}
			$scope.newCollaborator = ''
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.deleteCollaborator = function(collaborator) {
		$http({
			method: 'DELETE',
			url: '/api/git/repository/' + $routeParams.repositoryName + '/collaborator/' + collaborator
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					$scope.getRepository()
				}
			}
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.isEmptyRepository = function() {
		return GitService.isEmptyRepository()
	}

	$scope.getCurrentRepositoryName = function() {
		return GitService.getRepository()
	}

	$scope.getBranchs = function() {
		return GitService.getBranchs()
	}

	$scope.getCommits = function() {
		return GitService.getCommits()
	}

	$scope.getTags = function() {
		return GitService.getTags()
	}

	$scope.getCurrentBranch = function() {
		return GitService.getCurrentBranch()
	}

	$scope.getCommitNum = function() {
		return GitService.getCommitNum()
	}

	$scope.getBranchNum = function() {
		return GitService.getBranchNum()
	}

	$scope.getTagNum = function() {
		return GitService.getTagNum()
	}

	$scope.getCollaborator = function() {
		return GitService.getCollaborator()
	}

	$scope.getCollaboratorNum = function() {
		return GitService.getCollaboratorNum()
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
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					$location.path("/sshkey")
				} else {
					$rootScope.$broadcast('errorIn', response.data.result)
				}
			}

			$scope.sshKey = ''
			$scope.keyName = ''
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.deleteSshKey = function(sshKeyName) {
		$http.delete('/api/user/ssh_key/' + sshKeyName)
		.then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					UserService.setUserData(response.data.data)
				}
			}			
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.getSshKeys = function() {
		$http({
			method: 'GET',
			url: '/api/user/'
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				UserService.setUserData(response.data)
				$scope.sshKeyList = UserService.getSshKeys()
			} else {
				$location.path("/")
			}
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.login = function() {
		var data = {
			username: $scope.username,
			password: $scope.password,
		}
		console.log(data)
		$http({
			method: 'POST',
			url: '/api/user/signin',
			data: data
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					UserService.setUserData(response.data.data)
					if (UserService.isAdmin()) {
						$location.path("/admin")
					} else {
						$location.path("/repository")
					}
				}
			}

			$scope.username = ''
			$scope.password = ''
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
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
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					UserService.setUserData(response.data.data)
					$location.path("/repository")
				} else {
					$scope.errorMessage = response.data.result
					$scope.isNotMatch = true
					$scope.usernameClass = 'invalid-form'
					$scope.passwordClass = 'invalid-form'
					$scope.checkPasswordClass = 'invalid-form'
				}
			}

			$scope.username = ''
			$scope.password = ''
			$scope.checkPassword = ''
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.updatePassword = function() {
		var data = {
			password: $scope.oldPassword,
			newPassword: $scope.newPassword
		}
		$http({
			method: 'POST',
			url: '/api/user/change_password',
			data: data
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					$location.path("/repository")
				} else {
					$scope.errorMessage = response.data.result
					$scope.isNotMatch = true
					$scope.newPasswordClass = 'invalid-form'
					$scope.confirmPasswordClass = 'invalid-form'
				}
			}

			$scope.oldPassword = ''
			$scope.newPassword = ''
			$scope.confirmPassword = ''
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}

	$scope.redirectTo = function(path) {
		console.log(path)
		$location.path(path)
	}

	$scope.getDomain = function() {
		return $location.host()
	}

	$scope.isRepositoryTab = function() {
		if ($scope.tab == REPOSITORY_TAB) {
			return true
		} else {
			return false
		}
	}

	$scope.isReleasesTab = function() {
		if ($scope.tab == RELEASES_TAB) {
			return true
		} else {
			return false
		}
	}

	$scope.isContributorTab = function() {
		if ($scope.tab == CONTRIBUTOR_TAB) {
			return true
		} else {
			return false
		}
	}

	$scope.setTab = function(tab) {
		$scope.tab = tab
	}

	// Receiver
	$scope.$on('errorIn', function(event, message){
		$timeout(function(){
			$scope.$apply(function(){
				$scope.errorMessage = message
			})
		})
	})

	// Subscribes
	UserService.subscribeUserChange($scope, function changeUser() {
		$scope.sshKeyList = UserService.getSshKeys()
	})

	// Inner functions
	var getCollaborators = function(index) {
		var repository = $scope.repositoryList[index].name
		$http({
			method: 'GET',
			url: '/api/git/repository/' + repository + '/collaborator'
		}).then(function successCallback(response) {
			console.log(response)
			if (response.status == 200) {
				if (response.data.code == 200) {
					$scope.repositoryList[index].collaboratorList = response.data.data
				}
			}
		}, function errorCallback(error) {
			console.log(error)
			$location.path("/")
		})
	}
})