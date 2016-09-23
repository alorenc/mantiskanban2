/* global Mantis, Kanban */

// Point to the location of your server
Mantis.ConnectURL = "http://mantis.server.com/api/soap/mantisconnect.php";

// Set this to the hostname of your server
// If you have mantis running inside a directory, you'll need to add that on as well.
// This field is used to build links like this http://mantis.server.com/view.php?id=847
Mantis.ServerHostname = "mantis.server.com";

// The default filter to use when loading a projects issues
// If you leave this null, mantis will load whatever the last filter you used when you logged into the php site.
Mantis.DefaultFilterID = "0";

// Use this value if you want to load additional closed issues, in addition to all the other statuses.   A good use for this is to load open issues
// with DefaultFilterID, and load certain number of recently closed issues with these parameters.
Mantis.ClosedIssuesFilterID = "0";

// How many issues should the call to the ClosedIssueFilterID return
Kanban.NumberOfClosedMessagesToLoad = 10;

// This is the default project to be selected
Mantis.CurrentProjectSelection = 0;

Mantis.TaskListField = "TaskList";

// The default name for the custom field containg split column  of Mantis (ScrumBucket)
Kanban._listIDField = "ScrumBucket";

// Default name category
Kanban.DefaultCategory = "General";

// Scrum Mode - default switch
Kanban.ScrumMode = "Review";

// Scrum default Status
Kanban.ScrumDefaultStatus = "Backlog";

// Scrum Steps
Kanban.ScrumSteps = {
	"Backlog" : true,
	"AnalysisPlaning" : true,
	"SprintBacklog" : true,
	"InProgress" : true,
	"Testing" : true,
	"Implementation" : true,
	"Relase" : true
};

// Backlog|AnalysisPlaning|SprintBacklog| InProgress| Testing | Implementation | Relase
Kanban.ScrumModes = {
	"Review" : {
		"SprintBacklog" : true,
		"InProgress" : true,
		"Testing" : true,
		"Implementation" : true,
		"Relase" : true
	},
	"Planif" : {
		"Backlog" : true,
		"AnalysisPlaning" : true,
		"SprintBacklog" : true
	}
};

// When a project has a custom field, you can specify mantis statuses to change to when entering this bucket
Kanban.AutoStatusOnCustomField = {
	"ScrumBucket" : {
		"Backlog" : "10",
		"AnalysisPlaning" : "20",
		"SprintBacklog" : "30",
		"InProgress" : "70",
		"Testing" : "80",
		"Implementation" : "80",
		"Relase" : "90"
	}
};

// Use this to set default icons for categories
Kanban.CategoryIconMap = {
	"Bug" : "fire text-danger"
};

// This is used to just define the Default Settings object, this info gets saved to local storage for next login
var DefaultSettings = {
	username : "",
	stayLoggedIn : 1,
	lastAccessTime : 0,
	autoResizeColumns : true,
	currentProject : Mantis.CurrentProjectSelection,
	connectURL : Mantis.ConnectURL,
	FiltersUsers : [],		//id users filters default
	FiltersPriority : [],	//weight priority default
	FiltersSeverity : []	//weight severity default
};

// Maintaining user sessions when not active for the specified number of minutes
Kanban.InactiveSessionTimeUserInMinutes = 30; // minuts

// List of Installed Themes should be here
Kanban.Themes = [
	{name : "Default", stylesheet : "themes/default.css"},
	{name : "Green", stylesheet : "themes/green.css"},
	{name : "Trello", stylesheet : "themes/trello.css"}
];