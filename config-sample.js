/// Point to the location of your server
Mantis.ConnectURL = "http://mantis.server.com/api/soap/mantisconnect.php";

/// Set this to the hostname of your server
/// If you have mantis running inside a directory, you'll need to add that on as well.
/// This field is used to build links like this http://mantis.server.com/view.php?id=847
Mantis.ServerHostname = "mantis.server.com";

/// The default filter to use when loading a projects issues
/// If you leave this null, mantis will load whatever the last filter you used when you logged into the php site.
Mantis.DefaultFilterID = "0";

/// Use this value if you want to load additional closed issues, in addition to all the other statuses.   A good use for this is to load open issues
/// with DefaultFilterID, and load certain number of recently closed issues with these parameters.
Mantis.ClosedIssuesFilterID = "0";

/// How many issues should the call to the ClosedIssueFilterID return
Kanban.NumberOfClosedMessagesToLoad = 10;

/// This is the default project to be selected
Mantis.CurrentProjectSelection = "0";

Mantis.TaskListField = "TaskList";

// Scrum mode
Kanban.ScrumMode = "Review";
Kanban.ScrumDefaultStatus = "Backlog";

Kanban.ScrumSteps = {
	"Backlog" : true,
	"NextSprint" : true,
	"CurrentSprint" : true,
	"Design" : true,
	"CodeInProgress" : true,
	"Testing" : true,
	"Release" : true
}

Kanban.ScrumModes = {
	"Review" : {
		"CurrentSprint" : true,
		"Design" : true,
		"CodeInProgress" : true,
		"Testing" : true,
		"Release" : true
	},
	"Planif" : {
		"Backlog" : true,
		"NextSprint" : true,
		"CurrentSprint" : true
	}
}

Kanban.PriorityField = "Priority";
Kanban.Priorities = {
	"Immediate" : {
		"value" : 60
	},
	"Urgente" : {
		"value" : 50
	},
	"Elevée" : {
		"value" : 40
	},
	"Normale" : {
		"value" : 30
	},
	"Basse" : {
		"value" : 20
	}
}

/// When a project has a custom field, you can specify mantis statuses to change to when entering this bucket
Kanban.AutoStatusOnCustomField = {
	"ScrumBucket" : {
	}
}

/// Use this to set default icons for categories
Kanban.CategoryIconMap =  {
	"Bug" : "info-sign",
	"Task" : "calendar",
	"Feature" : "star"
}


/// This is used to just define the Default Settings object, this info gets saved to local storage for next login
var DefaultSettings = {
	username:"",
	stayLoggedIn:1,
	lastAccessTime:0,
	autoResizeColumns : true,
	currentProject:Mantis.CurrentProjectSelection
};


/// List of Installed Themes should be here
Kanban.Themes =
[
	{name: "Default", stylesheet : "themes/default.css" },
	{name: "Green", stylesheet : "themes/green.css"},
	{name: "Trello", stylesheet : "themes/trello.css"},

];

