var myApp = angular.module('myApp')

myApp.factory('GitService', function($rootScope, $http) {
	var repositoryName = ''
	var currentBranch = ''
	var gitData = {
		owner: '',
		defaultBranch: '',
		branchList: [],
		tagList: [],
		commitList: [],
		collaboratorList: []
	}
	return {
		getRepository: function() {
			return repositoryName
		},
		setGitData: function(name, data) {
			repositoryName = name
			gitData.defaultBranch = data.defaultBranch
			gitData.branchList = data.branchList
			gitData.tagList = data.tagList
			gitData.commitList = data.commitList
			if (data.owner) {
				gitData.owner = data.owner
			} else {
				gitData.owner = ''
			}
			if (data.collaboratorList) {
				gitData.collaboratorList = data.collaboratorList
			}
			currentBranch = gitData.defaultBranch

			// Process commits
			for (var i in gitData.commitList) {
				if (gitData.commitList[i].summary === gitData.commitList[i].message.replace(/(\r\n|\r|\n)/gm,'')) {
					gitData.commitList[i]['hasMoreInfo'] = false
				} else {
					gitData.commitList[i]['hasMoreInfo'] = true
				}

				// Separate the author and email
				gitData.commitList[i]['authorEmail'] = ''
				if (gitData.commitList[i].author.indexOf('>') == gitData.commitList[i].author.length-1) {
					var startIndex = gitData.commitList[i].author.indexOf(' <')
					if (startIndex > 0) {
						gitData.commitList[i]['authorEmail'] = gitData.commitList[i].author.substring(startIndex+2, gitData.commitList[i].author.length-1)
						gitData.commitList[i].author = gitData.commitList[i].author.substring(0, startIndex)
					}
				}
			}
		},
		setCollaboratorList: function(collaboratorList) {
			gitData.collaboratorList = collaboratorList
		},
		setCurrentBranch: function(branch) {
			currentBranch = branch
		},
		getDefaultBranch: function() {
			return gitData.defaultBranch
		},
		getBranchs: function() {
			return gitData.branchList
		},
		getTags: function() {
			return gitData.tagList
		},
		getCommits: function() {
			return gitData.commitList
		},
		getCurrentBranch: function() {
			return currentBranch
		},
		getCommitNum: function() {
			return gitData.commitList.length
		},
		getBranchNum: function() {
			return gitData.branchList.length
		},
		getTagNum: function() {
			return gitData.tagList.length
		},
		getCollaborator: function() {
			return gitData.collaboratorList
		},
		getCollaboratorNum: function() {
			return gitData.collaboratorList.length
		},
		getOwner: function() {
			return gitData.owner
		},
		isEmptyRepository: function() {
			if (gitData.defaultBranch.length == 0) {
				return true
			} else {
				return false
			}
		}
	}
})