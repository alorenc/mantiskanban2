/* global Mantis, langObj, e, returnObj, urlParams, DefaultSettings, AutoAdjustListWidth */

var Kanban = {
	Preload : function() {
		Mantis.Preload();
	},
	get CurrentProject() {
		for(var i = 0; i < Kanban.Projects.length; i++) {
			if(document.getElementById("seletedproject").value == Kanban.Projects[i].ID) {
				return Kanban.Projects[i];
			}
		}
		return new KanbanProject({
			"name" : "No Name",
			"id" : 0
		});
	},
	get CurrentUser() {
		return Kanban._currentUser;
	},
	set CurrentUser(value) {
		Kanban._currentUser = value;
	},
	get Tags() {
		return Mantis.Tags;
	},
	get ProjectUsers() {
		var usersGet = Mantis.ProjectUsers;

		if(usersGet.length > 0) {
			for(var ui = 0; ui < usersGet.length; ui++) {
				Kanban._projectUsers[usersGet[ui].id] = usersGet[ui].name;
			}
		}

		return Kanban._projectUsers;
	},
	BlockUpdates : false,
	Dragging : false,
	UsingCustomField : false,
	_listIDField : 'ScrumBucket',
	_currentUser : null,
	_projectUsers : [],
	GetCategoryIcon : function(category) {
		if(Kanban.CategoryIconMap == undefined) {
			return "bookmark";
		} else if(Kanban.CategoryIconMap[category] == undefined) {
			return "bookmark";
		} else {
			return Kanban.CategoryIconMap[category];
		}
	},
	GetUserByID : function(userid) {
		for(var ui = 0; ui < Kanban.CurrentProject.Users.lenth; ui++) {
			if(Kanban.CurrentProject.Users[ui].ID == userid)
				return Kanban.CurrentProject.Users[ui];
		}
		return null;
	},
	GetListByID : function(listid) {
		for(var li = 0; li < Kanban.Lists.length; li++) {
			if(Kanban.Lists[li].ID == listid)
				return Kanban.Lists[li];
		}
		return null;
	},
	UndoInfo : {
		StoryDiv : null,
		ListDiv : null
	},
	get Container() {
		return document.getElementById("kanbancontent");
	},
	Projects : [],
	Lists : [],
	Stories : [],
	AssignedUsers : [],
	/*
	 * @name HasStory
	 * @returns {boolean} Returns true if the story is already loaded into the "Mantis.Stories" array.
	 * @argument {int} id The ID of the story to look for
	 */
	HasStory : function(id) {
		for(var i = 0; i < Kanban.Stories.length; i++) {
			if(Kanban.Stories[i].ID == id)
				return true;
		}
		return false;
	},
	HasProject : function(id) {
		for(var i = 0; i < Kanban.Projects.length; i++) {
			if(Kanban.Projects[i].ID == id)
				return true;
		}
		return false;
	},
	/*
	 * @name HasList
	 * @returns {boolean} Returns true if the list is already loaded into the "Mantis.Lists" array.
	 * @argument {int} id The ID of the list to look for
	 */
	HasList : function(id) {
		for(var i = 0; i < Kanban.Lists.length; i++) {
			if(Kanban.Lists[i].ID == id)
				return true;
		}
		return false;
	},
	CloseAddStoryDialog : function() {
		CloseAddStory();
	},
	GetStoryByFieldValue : function(field, value) {
		for(var i = 0; i < Kanban.Stories.length; i++) {
			if(Kanban.Stories[i][field] == value)
				return Kanban.Stories[i];
		}
		return null;
	},
	ReplaceStory : function(Story) {
		for(var i = 0; i < Kanban.Stories.length; i++) {
			if(Story.ID == Kanban.Stories[i].ID) {
				Kanban.Stories[i] = Story;
			}
		}
	},
	AddStoryFromFormData : function() {
		var summary = $("#add-summary").val();
		var description = $("#add-description").val();
		if((description == null) || (description == ""))
			description = "-";
		var handlerid = document.getElementById("add-assignedto").value;
		var reporterid = document.getElementById("add-reporter").value;
		var statusid = document.getElementById("add-status").value;
		var priorityid = document.getElementById("add-priority").value;
		var category = document.getElementById("add-category").value;
		var customfieldvalue = null;
		var newIssueStruct = Mantis.UpdateStructureMethods.Issue.NewIssue(summary, description, Mantis.CurrentProjectID, handlerid, reporterid, statusid, priorityid, category);

		if(Kanban.UsingCustomField) {
			for(var i = 0; i < Mantis.ProjectCustomFields.length; i++) {
				var custom_field = Mantis.ProjectCustomFields[i];
				if(custom_field.field.name != Kanban._listIDField && custom_field.field.name != Mantis.TaskListField) {
					Mantis.UpdateStructureMethods.Issue.UpdateCustomField(newIssueStruct, custom_field.field.name, document.getElementById("add-" + custom_field.field.name).value);
				}
			}

//			console.log(Kanban._listIDField, document.getElementById("add-custom-field").value);
			Mantis.UpdateStructureMethods.Issue.UpdateCustomField(newIssueStruct, Kanban._listIDField, document.getElementById("add-custom-field").value);
		}

//		console.log(newIssueStruct.custom_fields);
		Kanban.AddStory(summary, description, handlerid, reporterid, statusid, priorityid, category, customfieldvalue);
	},
	AddStoryToArray : function(storyToAdd) {
		if(!Kanban.HasStory(storyToAdd.ID)) {
			if(storyToAdd.ListID != null) {
				Kanban.Stories[Kanban.Stories.length] = storyToAdd;
				storyToAdd.BuildKanbanStoryDiv();
				storyToAdd.List.Container.appendChild(storyToAdd.Element);
				storyToAdd.Element.classList.add("fadein");
				//Story.Element.style.display = 'block';
			}
		}
	},
	AddListToArray : function(listToAdd) {
		if(!Kanban.HasList(listToAdd.ID)) {
			Kanban.Lists[Kanban.Lists.length] = listToAdd;
		}
	},
	ClearListGUI : function() {
		while(Kanban.Container.childNodes.length != 0) {
			Kanban.Container.removeChild(Kanban.Container.firstChild);
		}
	},
	UndoLastKanbanMove : function() {
		if(Kanban.UndoInfo.ListDiv !== null) {
			Kanban.UndoInfo.ListDiv.insertBefore(Kanban.UndoInfo.StoryDiv, Kanban.UndoInfo.ListDiv.lastChild);
			Kanban.UndoInfo.StoryDiv.setAttribute("listid", Kanban.UndoInfo.ListDiv.getAttribute("id"));
		}
	},
	AddGlowToRelatedStories : function(id) {
		var foundStory = Kanban.GetStoryByFieldValue("ID", id);
		if(foundStory.RelatedStories.length > 0)
			foundStory.Element.children[0].children[1].classList.add("glow");
		for(var rel = 0; rel < foundStory.RelatedStories.length; rel++) {
			var foundRelation = Kanban.GetStoryByFieldValue("ID", foundStory.RelatedStories[rel]);
			if(foundRelation && foundRelation.Element) {
				foundRelation.Element.children[0].children[1].classList.add("glow");
			}
		}
	},
	RemoveGlowToRelatedStories : function(id) {
		var foundStory = Kanban.GetStoryByFieldValue("ID", id);
		if(foundStory.RelatedStories.length > 0)
			foundStory.Element.children[0].children[1].classList.remove("glow");
		for(var rel = 0; rel < foundStory.RelatedStories.length; rel++) {
			var foundRelation = Kanban.GetStoryByFieldValue("ID", foundStory.RelatedStories[rel]);
			if(foundRelation && foundRelation.Element) {
				foundRelation.Element.children[0].children[1].classList.remove("glow");
			}
		}
	},
	BuildListGUI : function() {
		for(var li = 0; li < Kanban.Lists.length; li++) {
			var kanbanListItem = Kanban.Lists[li];

			var existingElement = document.getElementById("listid" + kanbanListItem.ID);
			if(existingElement !== null)
				continue;

			///The main container
			var listDiv = document.createElement("div");
			kanbanListItem.Element = listDiv;
			listDiv.setAttribute("class", "kanbanlist");
			listDiv.setAttribute("id", "listid" + kanbanListItem.ID);
			listDiv.setAttribute("listid", kanbanListItem.ID);
			listDiv.addEventListener('dragover', HandleDragOver, false);
			listDiv.addEventListener('dragenter', HandleDragEnter, false);
			listDiv.addEventListener("drop", Drop, false);
			listDiv.List = kanbanListItem;

			///The title container
			var listDivTitle = document.createElement("div");
			listDivTitle.setAttribute("class", "kanbanlisttitle");
			listDivTitle.setAttribute("id", "kanbanlisttitle" + li);
			listDivTitle.setAttribute("listid", "listid" + kanbanListItem.ID);
			listDivTitle.innerHTML = kanbanListItem.Name.capitalize();
			listDiv.appendChild(listDivTitle);

			var listStoryContainer = document.createElement("div");
			listStoryContainer.setAttribute("class", "kanbanliststorycontainer");
			listStoryContainer.setAttribute("id", "kanbanliststorycontainer" + kanbanListItem.ID);
			listStoryContainer.setAttribute("listid", "listid" + kanbanListItem.ID);
			listDiv.appendChild(listStoryContainer);
			listDiv.Container = listStoryContainer;
			kanbanListItem.Container = listStoryContainer;

			var loadingDivContainer = document.createElement("div");
			loadingDivContainer.setAttribute("class", "loadingdivcontainer");

			var listLoadingDiv = document.createElement("div");
			listLoadingDiv.setAttribute("class", "loader tempLoadingDiv");
			listLoadingDiv.innerHTML = "<div class=\"dot dot1\"></div><div class=\"dot dot2\"></div><div class=\"dot dot3\"></div><div class=\"dot dot4\"></div>";
			//listLoadingDiv.innerHTML = '<center><div class="tempLoadingDiv"><img src="images/columnLoadingGif.gif"></div></center>';

			//var listLoadingInnerDiv = document.createElement("div");
			//listLoadingInnerDiv.innerHTML = "Loading...";
			//listLoadingDiv.appendChild(listLoadingInnerDiv);

			loadingDivContainer.appendChild(listLoadingDiv);
			listDiv.appendChild(loadingDivContainer);

			var listDropArea = document.createElement("div");
			listDropArea.setAttribute("class", "kanbanlistdroparea");
			listDropArea.setAttribute("id", "droplistid" + kanbanListItem.ID);
			listDropArea.setAttribute("listid", "listid" + kanbanListItem.ID);
			listDropArea.addEventListener('dragover', HandleDragOver, false);
			listDropArea.addEventListener('dragenter', HandleDragEnter, false);
			listDropArea.addEventListener("drop", Drop, false);
			listDropArea.innerHTML = langObj.textDropHere;
			listDiv.appendChild(listDropArea);

			///Add it all to the container div
			Kanban.Container.appendChild(listDiv);

			var spacingDiv = document.createElement("div");
			spacingDiv.setAttribute("class", "kanbanlistspacer");
			Kanban.Container.appendChild(spacingDiv);

			Kanban.Container.addEventListener('dragenter', HandleDragEnter, false);
		}
	}
};

Kanban.ApplyTheme = function(styleID) {
	DefaultSettings.selectedStyle = styleID;
	var style = Kanban.Themes[styleID];
	$("#themeLink").attr("href", style.stylesheet);
};

Kanban.SaveSettings = function() {
	//modifyStyleRule(selectorText, value)
	DefaultSettings.kanbanListWidth = document.getElementById("settings-list-width").value;
	DefaultSettings.autoResizeColumns = document.getElementById("settings-autofit-onresize").checked;
	DefaultSettings.selectedStyle = document.getElementById("settings-selectedTheme").value;
	saveSettingsToStorageMechanism();
	Kanban.ApplySettings();
};

Kanban.ApplySettingsAtLogin = function() {
	try {
		modifyStyleRule(".kanbanlist", "width", DefaultSettings.kanbanListWidth);
	} catch(e) {
	}
	if(DefaultSettings.autoResizeColumns) {
		window.addEventListener("resize", AutoAdjustListWidth);
		AutoAdjustListWidth();
	}
};

Kanban.ApplySettings = function() {
	var listWidthValue = document.getElementById("settings-list-width").value;
	modifyStyleRule(".kanbanlist", "width", listWidthValue);
	window.removeEventListener("resize", AutoAdjustListWidth);
	if(DefaultSettings.autoResizeColumns) {
		AutoAdjustListWidth();
		window.addEventListener("resize", AutoAdjustListWidth);
	}

	Kanban.ApplyTheme(document.getElementById("settings-selectedTheme").value);
};

Kanban.LoadRuntimeSettings = function() {
	document.getElementById("settings-list-width").value = getStyleRule(".kanbanlist", "width");
	document.getElementById("settings-autofit-onresize").checked = DefaultSettings.autoResizeColumns;
};

Kanban.ControlStayLoggedIn = function() {
	var TimeLocalStorage = Kanban.InactiveSessionTimeUserInMinutes * 60; // seconds
	var currentTime = Math.round(new Date().getTime() / 1000);

	if(DefaultSettings.stayLoggedIn == 1)
	{
		console.log((currentTime - DefaultSettings.lastAccessTime) + " < " + TimeLocalStorage);
		if(((currentTime - DefaultSettings.lastAccessTime) < TimeLocalStorage)) {
			log("user logged in less than 30 days ago put their name in the box");
			document.getElementById("username").value = DefaultSettings.username;
			document.getElementById("password").value = DefaultSettings.password;
		} else {
			Logout();
		}
	}
};

// With the active use time is reset
Kanban.RefreshTimeLocalStorage = function() {
	var currentTime = Math.round(new Date().getTime() / 1000);
	console.log((currentTime - DefaultSettings.lastAccessTime) + " < " + Kanban.InactiveSessionTimeUserInMinutes * 60);

	DefaultSettings.lastAccessTime = currentTime;
	saveSettingsToStorageMechanism();
};

Kanban.HowManyCompleteTasks = function(tasks) {
	var sum = 0;
	if(tasks.length > 0) {
		for(var ti = 0; ti < tasks.length; ti++) {
			if(tasks[ti].Status == 'complete') {
				sum++;
			}
		}
	}
	return sum;
};

Kanban.AddStory = function(summary, description, handlerid, reporterid, statusid, priorityid, category, customfield) {
	var newIssueStruct = Mantis.UpdateStructureMethods.Issue.NewIssue(summary, description, Mantis.CurrentProjectID, handlerid, reporterid, statusid, priorityid, category);
	if(customfield !== null) {
		Mantis.UpdateStructureMethods.Issue.UpdateCustomField(newIssueStruct, Kanban._listIDField, customfield);
	}
	Mantis.IssueAdd(newIssueStruct, Kanban.AddStoryAsyncCallback);
};

Kanban.AddStoryAsyncCallback = function(result) {
	Kanban.BlockUpdates = false;
	StopLoading();
	if(isNaN(result)) {
		alert("Error Adding: " + result);
	} else {
		try {
			var newStory = new KanbanStory(Mantis.IssueGet(result));
			newStory.BuildKanbanStoryDiv();
			if(newStory.List != null) {
				newStory.List.AddNewStoryUI(newStory);
			}
			Kanban.CloseAddStoryDialog();
		} catch(e) {
			console.log(e);
		}
	}

	UpdateKanbanListTitle();
};

Kanban.UpdateUnderlyingStorySource = function(originalStory) {
	var mantisIssue = Mantis.IssueGet(originalStory.ID, null);
	originalStory.StorySource = mantisIssue;
	return originalStory;
};

function DragCancel(event) {
	console.log("DragCancel1");
	event.preventDefault();
	console.log("DragCancel2");
}

function DragStart(event) {
	console.log("DragStart1");
	Kanban.Dragging = true;
	event.target.style.opacity = '.999999'; // this / e.target is the source node.
	event.dataTransfer.setData("Text", event.target.id);
	event.target.classList.add("rotation");
	console.log("DragStart2");
}

function DragEnd(event) {
	console.log("DragEnd1");
	Kanban.Dragging = false;
	event.target.classList.remove("rotation");
	console.log("DragEnd1");
}

function Drop(event) {
	event.preventDefault();
	if(event.target.id == "kanbancontent")
		return;
	if(Kanban.BlockUpdates)
		return;

	var data = event.dataTransfer.getData("Text");
	event.target.classList.remove('over');
	var listToDropIn = null;

	var sourceElement = document.getElementById(data);
	Kanban.UndoInfo.StoryDiv = sourceElement;
	Kanban.UndoInfo.ListDiv = document.getElementById(sourceElement.getAttribute("listid"));
	var sourceElementDropDiv = document.getElementById(sourceElement.getAttribute("dropdivid"));
	var targetStoryDiv = document.getElementById(event.target.getAttribute("storyid"));

	StartLoading();
	Kanban.BlockUpdates = true;

	if(sourceElement.Story.CategoryID == null) {
		sourceElement.Story.CategoryID = Mantis.ProjectCategories[0];
	}

	try {

		if(event.target.getAttribute("class") == "kanbanlist" && sourceElement.getAttribute("class").indexOf("storyinfobutton") < 0) {
			listToDropIn = event.target;
			UpdateListForCanbanStory(sourceElement.Story, listToDropIn.List, UpdateKanbanStoryComplete);
			listToDropIn.Container.insertBefore(sourceElement, listToDropIn.Container.lastChild);
		} else if(event.target.getAttribute("class") == "kanbanlistdroparea") {
			listToDropIn = document.getElementById(event.target.getAttribute("listid"));
			UpdateListForCanbanStory(sourceElement.Story, listToDropIn.List, UpdateKanbanStoryComplete);
			listToDropIn.Container.appendChild(sourceElement);
		} else if(event.target.getAttribute("class") == "kanbanlisttitle") {
			listToDropIn = document.getElementById(event.target.getAttribute("listid"));
			UpdateListForCanbanStory(sourceElement.Story, listToDropIn.List, UpdateKanbanStoryComplete);
			listToDropIn.Container.insertBefore(sourceElement, listToDropIn.Container.firstChild);
		} else {
			listToDropIn = document.getElementById(event.target.getAttribute("listid"));
			UpdateListForCanbanStory(sourceElement.Story, listToDropIn.List, UpdateKanbanStoryComplete);
			sourceElementDropDiv.classList.remove("over");
			if(targetStoryDiv !== undefined && targetStoryDiv != null) {
				listToDropIn.Container.insertBefore(sourceElement, targetStoryDiv);
			} else {
				listToDropIn.Container.appendChild(sourceElement);
			}
		}

		sourceElement.setAttribute("listid", listToDropIn.getAttribute("id"));
		sourceElementDropDiv.setAttribute("listid", listToDropIn.getAttribute("id"));

	} catch(e) {
		console.log(e);
		//alert("Error:" + e.message);
		Kanban.BlockUpdates = false;
		StopLoading();
	} finally {
		ClearAllDragHoverAreas();
	}

}

function MoveKanbanStoryToProperList(kanbanStory) {
	// //Kanban.UsingCustomField && foundStory.List.ID != foundStory.ListID) || (!Kanban.UsingCustomField &&
	var thisList = null;
	try {
		thisList = Kanban.GetListByID(kanbanStory.StorySource.status.id);
		thisList.AddNewStoryUI(kanbanStory);
	} catch(e) {
		if(e.message === 'thisList is null') {
			alert('Error Update: You can not move the issue. Subprojects must have the same ScumBucket');
		} else {
			alert('Error: Update: ' + e.message);
		}

		try {
			Kanban.UndoLastKanbanMove();
		} catch(e) {
			console.log(e);
		}
	}
}

function UpdateKanbanStoryComplete(result) {
	Kanban.BlockUpdates = false;
	StopLoading();

	if(result != "true") {
		try {
			Kanban.UndoLastKanbanMove();
		} catch(e) {
			console.log(e);
		}
		alert("Error Updating: " + result);
	} else {
		try {
			var foundStory = Kanban.GetStoryByFieldValue("ID", document.getElementById("edit-story-id").value);
			if(foundStory == null) {
				foundStory = Kanban.GetStoryByFieldValue("ID", Kanban.UndoInfo.StoryDiv.getAttribute("id").substr(8));
			}
			if(foundStory !== null) {
				///If its null, then we werent' editing the story, just dropping between the lists
				var foundStory = Kanban.UpdateUnderlyingStorySource(foundStory);

				///Move it to the new location first before we rebuild the gui
				if(foundStory.List.ID != document.getElementById(foundStory.Element.getAttribute("listid")).List.ID) {
					MoveKanbanStoryToProperList(foundStory);
				}

				foundStory.BuildKanbanStoryDiv();
				foundStory.Element.classList.add("nofadein");

				/// Make sure the list is still valid
			}

			UpdateKanbanListTitle();
		} catch(e) {
			console.log(e);
		}

		Kanban.UndoInfo.ListDiv = null;
		Kanban.UndoInfo.StoryDiv = null;
	}
}

function UpdateKanbanListTitle() {
	for(var li = 0; li < Kanban.Lists.length; li++) {
		var kanbanListItem = Kanban.Lists[li];

		var existingElement = document.getElementById("kanbanlisttitle" + li);

		var nbItem = 0;
		var workload = 0;
		for(var si = 0; si < kanbanListItem.Stories.length; si++) {
			if((kanbanListItem.Stories[si].Element != null) && (kanbanListItem.Stories[si].Element.style != null) && (kanbanListItem.Stories[si].Element.style.display != 'none')) {
				nbItem++;

				var cf = kanbanListItem.Stories[si].StorySource.custom_fields;
				if(cf != null) {
					for(var t = 0; t < cf.length; t++) {
						if((cf[t].field != null) && (cf[t].field.name == 'ChargeRestante') && (cf[t].value != null)) {
							workload += parseFloat(cf[t].value);
						}
					}
				}
			}
		}

// TODO: analysis required
//		var content = kanbanListItem.Name.capitalize() + " (" + nbItem + ((workload > 0) ? " => " + workload + "j" :"") + ")";
//
//		if (Kanban.CurrentProject.ProjectSource.description != '') {
//			if (kanbanListItem.Name.capitalize() == 'CurrentSprint') {
//				content += '<br />' + Kanban.CurrentProject.ProjectSource.description;
//			} else if (kanbanListItem.Name.capitalize() == 'NextSprint') {
//				var cf = Mantis.ProjectCustomFields;
//				if (cf != null) {
//					for (var t = 0; t < cf.length; t++) {
//						if ((cf[t].field != null) && (cf[t].field.name == 'Sprint')) {
//							var possibleValues = cf[t].possible_values.split('|');
//							var pos = possibleValues.indexOf(Kanban.CurrentProject.ProjectSource.description);
//							if (pos > -1) {
//								content += '<br />' + possibleValues[pos + 1];
//							}
//						}
//					}
//				}
//			}
//		}
//		existingElement.innerHTML = content;

		existingElement.innerHTML = kanbanListItem.Name.capitalize() + " (" + nbItem + ((workload > 0) ? " => " + workload + "j" : "") + ")";
	}
}

function UpdateStoryFromFormData() {
	Kanban.BlockUpdates = true;
	StartLoading();

	var thisStory = Kanban.GetStoryByFieldValue("ID", document.getElementById("edit-story-id").value);
	Mantis.IssueGet(thisStory.ID, function(storyToUpdate) {
		try {
			if(thisStory.Summary != $("#edit-summary").val()) {
				storyToUpdate.summary = $("#edit-summary").val();
			}
			if(thisStory.Description != $("#edit-description").val()) {
				storyToUpdate.description = $("#edit-description").val();
			}

			if(thisStory.HandlerID != document.getElementById("edit-assignedto").value) {
				storyToUpdate.handler = {
					"name" : "",
					"id" : (document.getElementById("edit-assignedto").value == "") ? null : document.getElementById("edit-assignedto").value
				};
			}
			if(thisStory.SeverityID != document.getElementById("edit-severity").value) {
				storyToUpdate.severity.id = (document.getElementById("edit-severity").value == "") ? null : document.getElementById("edit-severity").value;
			}
			if(thisStory.ResolutionID != document.getElementById("edit-resolution").value) {
				storyToUpdate.resolution.id = (document.getElementById("edit-resolution").value == "") ? null : document.getElementById("edit-resolution").value;
			}

			if(thisStory.ProjectID != document.getElementById("edit-project").value) {
				storyToUpdate.project.id = document.getElementById("edit-project").value;
			}
			if(thisStory.ReporterID != document.getElementById("edit-reporter").value) {
				storyToUpdate.reporter.id = document.getElementById("edit-reporter").value;
			}
			if(thisStory.PriorityID != document.getElementById("edit-priority").value) {
				storyToUpdate.priority.id = document.getElementById("edit-priority").value;
			}
			if(thisStory.StatusID != document.getElementById("edit-status").value) {
				storyToUpdate.status.id = document.getElementById("edit-status").value;
			}
			if(thisStory.Reproduce != document.getElementById("edit-reproduce").value) {
				storyToUpdate.steps_to_reproduce = document.getElementById("edit-reproduce").value;
			}
			if(thisStory.CategoryID != document.getElementById("edit-category").value) {
				storyToUpdate.category = document.getElementById("edit-category").value;
			}

			if(Kanban.UsingCustomField) {
				for(var i = 0; i < Mantis.ProjectCustomFields.length; i++) {
					var custom_field = Mantis.ProjectCustomFields[i];
					if(custom_field.field.name != Kanban._listIDField && custom_field.field.name != Mantis.TaskListField) {
						Mantis.UpdateStructureMethods.Issue.UpdateCustomField(storyToUpdate, custom_field.field.name, document.getElementById("edit-" + custom_field.field.name).value);
					}
				}
			}

			Mantis.IssueUpdate(thisStory.ID, storyToUpdate, UpdateKanbanStoryComplete);
			CloseEditStory();
		} catch(e) {
			console.log(e);
			alert("Error:" + e.message);
			StopLoading();
		} finally {
			Kanban.BlockUpdates = false;
			StopLoading();
		}
	});

	StopLoading();
}

function UpdateStoryStatusWhenCustomFieldUpdated(UpatedStory, CustomFieldName, CustomFieldValue) {
	if(Kanban.AutoStatusOnCustomField[CustomFieldName][CustomFieldValue] != undefined) {
		Mantis.UpdateStructureMethods.Issue.UpdateStatus(UpatedStory.StorySource, Kanban.AutoStatusOnCustomField[CustomFieldName][CustomFieldValue], "");
	}
}

function UpdateListForCanbanStory(KanbanStoryToUpdate, KanbanListToMoveTo, UpdateKanbanStoryCallback) {
	// Reload issue before change status or custom field
	Mantis.IssueGet(KanbanStoryToUpdate.ID, function(updateIssue) {
		if(KanbanStoryToUpdate.UsesCustomField) {
			UpdateStoryStatusWhenCustomFieldUpdated(KanbanStoryToUpdate, Kanban._listIDField, KanbanListToMoveTo.ID);
			updateIssue = Mantis.UpdateStructureMethods.Issue.UpdateCustomField(updateIssue, Kanban._listIDField, KanbanListToMoveTo.ID);
		} else {
			updateIssue = Mantis.UpdateStructureMethods.Issue.UpdateStatus(updateIssue, KanbanListToMoveTo.ID, KanbanListToMoveTo.Name);
		}

// TODO: analysis required
//		if (KanbanListToMoveTo.Name == 'NextSprint') {
//			var cf = Mantis.ProjectCustomFields;
//			if (cf != null) {
//				for (var t = 0; t < cf.length; t++) {
//					if ((cf[t].field != null) && (cf[t].field.name == 'Sprint')) {
//						var possibleValues = cf[t].possible_values.split('|');
//						var pos = possibleValues.indexOf(Kanban.CurrentProject.ProjectSource.description);
//						if (pos > -1) {
//							updateIssue = Mantis.UpdateStructureMethods.Issue.UpdateCustomField(updateIssue, "Sprint", possibleValues[pos + 1]);
//						}
//					}
//				}
//			}
//		} else if (KanbanListToMoveTo.Name == 'CurrentSprint') {
//			updateIssue = Mantis.UpdateStructureMethods.Issue.UpdateCustomField(updateIssue, "Sprint", Kanban.CurrentProject.ProjectSource.description);
//		} else if (KanbanListToMoveTo.Name == 'Backlog') {
//			updateIssue = Mantis.UpdateStructureMethods.Issue.UpdateCustomField(updateIssue, "Sprint", '');
//		}

		for(var li = 0; li < Kanban.Lists.length; li++) {
			var kanbanList = Kanban.Lists[li];

			if(kanbanList.ID == KanbanListToMoveTo.ID) {
				kanbanList.AddStory(KanbanStoryToUpdate);
			} else {
				kanbanList.RemoveStory(KanbanStoryToUpdate);
			}
		}

		var updateSucceeded = false;
		try {
			KanbanStoryToUpdate.StorySource = updateIssue;
			Mantis.IssueUpdate(KanbanStoryToUpdate.ID, updateIssue, UpdateKanbanStoryCallback);
		} catch(e) {
			console.log(e, returnObj);
			alert("Error Updating Story: " + e.message);
		}
	});
}

function ClearAllDragHoverAreas() {
	var elements = document.getElementsByClassName("over");
	for(var i = 0; i < elements.length; i++) {
		elements[i].classList.remove("over");
	}
}

var previousDragOverItem = null;

function HandleDragOver(e) {
	if(e.preventDefault) {
		e.preventDefault(); // Necessary. Allows us to drop.
	}

	if(e.target.getAttribute("id") == "kanbancontent") {
		ClearAllDragHoverAreas();
		return false;
	}

	e.dataTransfer.dropEffect = 'move';
	var storyID = e.target.getAttribute("storyid");
	if(storyID != e.target.getAttribute("id")) {
		var dropDiv = document.getElementById(e.target.getAttribute("dropdivid"));
		if(storyID == previousDragOverItem)
			return false;

		previousDragOverItem = storyID;
		ClearAllDragHoverAreas();
		if(dropDiv != null)
			dropDiv.classList.add("over");
	}
	return false;
}

function HandleDragEnter(e) {
	//ClearAllDragHoverAreas();
	//console.log("HandleDragEnter: StoryID: " + e.target.getAttribute("storyid") + "  ID: " + e.target.id);
}

function HandleDragLeave(e) {
	if(e.target.hasAttribute("storyid")) {
		var storyID = e.target.getAttribute("storyid");
		if(storyID != previousDragOverItem)
			return false;
	}

	if(!e.target.classList.contains("kanbanstorycontainer"))
		return false;

	if(e.target.hasAttribute("dropdivid")) {
		var dropDiv = document.getElementById(e.target.getAttribute("dropdivid"));
		if(dropDiv != null)
			dropDiv.classList.remove("over");
	}
}


function SaveNewNote(storyID, noteText) {
	try {
		noteText = FormatTextAsHTML(noteText);
		Kanban.BlockUpdates = true;
		StartLoading();
		var editStory = Kanban.GetStoryByFieldValue("ID", storyID);
		var newNote = Mantis.UpdateStructureMethods.Note.NewNote(noteText);
		Mantis.IssueNoteAdd(editStory.ID, newNote);
		editStory = Kanban.UpdateUnderlyingStorySource(editStory, true);
		AddNotesToStoryEditForm(editStory);
		document.getElementById("edit-newnotetext").value = "";
	} catch(e) {
		console.log(e);
		alert("Error Saving Note: " + e.message);
	} finally {
		StopLoading();
		Kanban.BlockUpdates = false;
	}
}

function ClearUploadList() {
	var attachmentList = document.getElementById('newAttachmentList');
	while(attachmentList.childNodes.length > 0) {
		attachmentList.removeChild(attachmentList.firstChild);
	}
	document.getElementById('newAttachmentFile').value = "";
}

function SaveNewAttachments() {
	try {
		if(Kanban.BlockUpdates)
			return;
		Kanban.BlockUpdates = true;
		StartLoading();
		var attachmentList = document.getElementById("newAttachmentList");
		for(var ach = 0; ach < attachmentList.childNodes.length; ach++) {
			var attachmentDiv = attachmentList.childNodes[ach];
			try {
				var storyID = $("#edit-story-id").val();
				var myStory = Kanban.GetStoryByFieldValue("ID", storyID);
				Mantis.IssueAttachmentAdd(storyID,
						attachmentDiv.getAttribute("filename"),
						attachmentDiv.getAttribute("filetype"),
						attachmentDiv.getAttribute("filedata"));
			} catch(e) {
				alert("Error Uploading Attachments: \r\n" + e.message);
			}
		}
		while(attachmentList.childNodes.length > 0) {
			attachmentList.removeChild(attachmentList.firstChild);
		}
		document.getElementById('newAttachmentFile').value = "";

		myStory = Kanban.UpdateUnderlyingStorySource(myStory);
		myStory.BuildKanbanStoryDiv();
		myStory.Element.classList.add("nofadein");
		AddAttachmentToStory(myStory);
	} finally {
		Kanban.BlockUpdates = false;
		StopLoading();

	}
}

function DeleteAttachment(AttachmentID) {
	try {
		if(!confirm("Are you sure you want to delete this attachment?"))
			return;

		Kanban.BlockUpdates = true;
		StartLoading();
		Mantis.IssueAttachmentDelete(AttachmentID);
		///If delete worked, remove the element
		var attachmentElement = document.getElementById("attachmentcontainer" + AttachmentID);
		var storyID = attachmentElement.getAttribute("storyid");
		if(!attachmentElement)
			return;

		///Update the UI
		attachmentElement.parentNode.removeChild(attachmentElement);
		var myStory = Kanban.GetStoryByFieldValue("ID", storyID);
		myStory = Kanban.UpdateUnderlyingStorySource(myStory);
		myStory.BuildKanbanStoryDiv();
		myStory.Element.classList.add("nofadein");
	} catch(e) {
		alert("Error Deleting:" + e.message);
	} finally {
		Kanban.BlockUpdates = false;
		StopLoading();

	}

}


function LoadTagsInDropDown() {
	var editFormTags = document.getElementById("edit-story-tags-list");
	try {
		while(editFormTags.childNodes.length > 0) {
			editFormTags.removeChild(editFormTags.firstChild);
		}
	} catch(e) {
	}

	for(var ti = 0; ti < Kanban.Tags.length; ti++) {
		var thisTag = Kanban.Tags[ti];

		var liTag = document.createElement("li");
		var aTag = document.createElement("a");
		aTag.innerHTML = thisTag.name;
		aTag.setAttribute("value", thisTag.id);
		aTag.setAttribute("href", "#");
		aTag.setAttribute("onclick", "AddTagToEditingStory(" + thisTag.id + ");");

		liTag.appendChild(aTag);

		editFormTags.appendChild(liTag);

	}
}


function AddTagsToStoryEditForm(KanbanStory) {

	LoadTagsInDropDown();

	var tagsContainer = document.getElementById("edit-story-tags-container");

	try {
		while(tagsContainer.childNodes.length > 0) {
			tagsContainer.removeChild(tagsContainer.firstChild);
		}
	} catch(e) {
	}

	for(var tcnt = 0; tcnt < KanbanStory.Tags.length; tcnt++) {
		var thisTag = KanbanStory.Tags[tcnt];
		var tagDiv = document.createElement("span");
		tagDiv.setAttribute("class", "label label-warning");
		tagDiv.setAttribute("onclick", "RemoveTagFromEditStory(" + thisTag.id + ")");
		tagDiv.setAttribute("style", "cursor: pointer;");
		//tagDiv.setAttribute("style", GetStyleCodeFor3Digits(thisTag.name) + "; cursor: pointer;")
		tagDiv.setAttribute("title", "Click to remove");
		tagDiv.innerHTML = thisTag.name;
		tagsContainer.appendChild(tagDiv);
	}


}

function AddNewTagFromEditForm() {
	var newTagText = document.getElementById("edit-story-new-tag").value;
	if(newTagText == "")
		return;
	var newTagStructure = Mantis.UpdateStructureMethods.Tag.NewTag(newTagText, newTagText);
	var newTagID = Mantis.TagAdd(newTagStructure);
	Mantis.LoadTagsSync();
	AddTagToEditingStory(newTagID);
	document.getElementById("edit-story-new-tag").value = "";
}

function AddTagToEditingStory(tagID) {
	var storyID = $("#edit-story-id").val();
	var tagStory = Kanban.GetStoryByFieldValue("ID", storyID);
	var foundTag = null;
	for(var ti = 0; ti < Kanban.Tags.length; ti++) {
		var thisTag = Kanban.Tags[ti];
		if(tagID == thisTag.id) {
			foundTag = thisTag;
			break;
		}
	}

	if(foundTag != null && !tagStory.HasTag(tagID)) {
		tagStory.AddTag(foundTag);
		Mantis.IssueSetTags(tagStory.ID, tagStory.Tags);
		tagStory.BuildKanbanStoryDiv();
		tagStory.Element.classList.add("nofadein");
		AddTagsToStoryEditForm(tagStory);
	}
}

function RemoveTagFromEditStory(tagID) {
	//if(!confirm("Are you sure you want to remove this tag?")) return;

	var storyID = $("#edit-story-id").val();
	var tagStory = Kanban.GetStoryByFieldValue("ID", storyID);

	tagStory.RemoveTag(tagID);
	Mantis.IssueSetTags(tagStory.ID, tagStory.Tags);
	tagStory.BuildKanbanStoryDiv();
	tagStory.Element.classList.add("nofadein");
	AddTagsToStoryEditForm(tagStory);
}

function AddAttachmentToStoryEditForm(KanbanStory) {
	var attachmentsContainer = document.getElementById("edit-story-attachment-container");

	try {
		while(attachmentsContainer.childNodes.length > 0) {
			attachmentsContainer.removeChild(attachmentsContainer.firstChild);
		}
	} catch(e) {
	}

	if(KanbanStory.Attachments == undefined || KanbanStory.Attachments.length == 0)
		return;

	for(var i = 0; i < KanbanStory.Attachments.length; i++) {
		var thisAttachment = KanbanStory.Attachments[i];
		var attachmentDiv = document.createElement("div");
		attachmentDiv.setAttribute("id", "attachmentcontainer" + thisAttachment.id);
		attachmentDiv.setAttribute("class", "attachmentcontainer");
		attachmentDiv.setAttribute("storyid", KanbanStory.ID);
		attachmentsContainer.appendChild(attachmentDiv);
	}


	/// This is what an attachment looks like
	//  <xsd:element name="id" type="xsd:integer" minOccurs="0"/>
	// <xsd:element name="filename" type="xsd:string" minOccurs="0"/>
	// <xsd:element name="size" type="xsd:integer" minOccurs="0"/>
	// <xsd:element name="content_type" type="xsd:string" minOccurs="0"/>
	// <xsd:element name="date_submitted" type="xsd:dateTime" minOccurs="0"/>
	// <xsd:element name="download_url" type="xsd:anyURI" minOccurs="0"/>
	// <xsd:element name="user_id" type="xsd:integer" minOccurs="0"/>

	if(KanbanStory.Attachments === undefined)
		return;

	for(var i = 0; i < KanbanStory.Attachments.length; i++) {
		var thisAttachment = KanbanStory.Attachments[i];
		var attachmentDiv = document.createElement("div");
		attachmentDiv.setAttribute("id", "attachmentcontainer" + thisAttachment.id);
		attachmentDiv.setAttribute("class", "attachmentcontainer");
		attachmentDiv.setAttribute("storyid", KanbanStory.ID);
		attachmentsContainer.appendChild(attachmentDiv);

		var attachmentDeleteButton = document.createElement("div");
		attachmentDeleteButton.setAttribute("class", "btn btn-small btn-danger attachmentdeletebutton");
		attachmentDeleteButton.setAttribute("onclick", "DeleteAttachment(" + thisAttachment.id + ")");
		attachmentDeleteButton.setAttribute("storyid", KanbanStory.ID);
		attachmentDeleteButton.innerHTML = "<span class=\" glyphicon glyphicon-trash\"></span> Delete";
		attachmentDiv.appendChild(attachmentDeleteButton);

		if(thisAttachment.content_type.match("image")) {
			var attachmentImage = document.createElement("img");
			attachmentImage.setAttribute("id", "attachment" + thisAttachment.id);
			attachmentImage.setAttribute("src", "images/loading.gif");
			attachmentImage.setAttribute("class", "kanbanimageattachment");
			attachmentImage.setAttribute("onclick", "OpenLightBox('#attachment" + thisAttachment.id + "');");
			Mantis.IssueAttachmentGet(thisAttachment.id, thisAttachment.content_type, function(result, attachmentID, attachementContentType) {
				var foundAttachmentImage = document.getElementById("attachment" + attachmentID);
				var resultText = "";
				resultText = result["#text"];
				if(resultText == undefined)
					resultText = result;
				//console.log("ATTACHMENT ID " + attachmentID + ": " + resultText);
				foundAttachmentImage.setAttribute("src", "data:" + attachementContentType + ";base64," + resultText);
			});

			attachmentDiv.appendChild(attachmentImage);
		} else {

			var attachmentFileName = document.createElement("a");
			attachmentFileName.setAttribute("id", "attachment" + thisAttachment.id);
			attachmentFileName.setAttribute("class", "attachmentname");
			attachmentFileName.setAttribute("download", thisAttachment.filename);
			attachmentFileName.innerHTML = thisAttachment.filename;
			Mantis.IssueAttachmentGet(thisAttachment.id, thisAttachment.content_type, function(result, attachmentID, attachementContentType) {
				var foundAttachmentDiv = document.getElementById("attachment" + attachmentID);
				var resultText = "";
				resultText = result["#text"];
				if(resultText == undefined)
					resultText = result;
				//console.log("ATTACHMENT ID " + attachmentID + ": " + resultText);
				foundAttachmentDiv.setAttribute("href", "data:application/octet-stream;base64," + resultText + "");


			});
			attachmentDiv.appendChild(attachmentFileName);
		}


	}
}

function SaveNewTask(storyID, taskDescription) {
	/// Requires mantis 1.3.0 at minimum
	if(Mantis.Version() < "1.3.0")
		return;

	try {
		taskDescription = FormatTextAsHTML(taskDescription);
		Kanban.BlockUpdates = true;
		StartLoading();
		var editStory = Kanban.GetStoryByFieldValue("ID", storyID);
		var newTask = Mantis.UpdateStructureMethods.Task.NewTask("open", taskDescription);
		var taskList = editStory.Tasks;
		taskList[taskList.length] = newTask;
		editStory.Tasks = taskList;
		Mantis.IssueUpdate(editStory.ID, editStory.StorySource);
		editStory = Kanban.UpdateUnderlyingStorySource(editStory, true);
		AddTasksToStoryEditForm(editStory);
		document.getElementById("edit-newtasktext").value = "";
	} catch(e) {
		console.log(e);
		console.log('SaveNewTask');
		alert("Error Saving Task: " + e.message);
	} finally {
		StopLoading();
		Kanban.BlockUpdates = false;
	}
}
function ChangeTaskStatus(storyID, taskID, isChecked) {
	/// Requires mantis 1.3.0 at minimum
	if(Mantis.Version() < "1.3.0")
		return;
	Kanban.BlockUpdates = true;
	StartLoading();

	try {
		var newStory = new KanbanStory(Mantis.IssueGet(storyID));
		var taskList = newStory.Tasks;
		taskList[taskID].Status = isChecked ? "complete" : "open";
		newStory.Tasks = taskList;

		Mantis.IssueUpdate(newStory.ID, newStory.StorySource);
		newStory = Kanban.UpdateUnderlyingStorySource(newStory, true);
		AddTasksToStoryEditForm(newStory);
		document.getElementById("edit-newtasktext").value = "";
	} catch(e) {
		console.log(e);
		console.log('ChangeTaskStatus');
		alert("Error Saving Task: " + e.message);
	} finally {
		StopLoading();
		Kanban.BlockUpdates = false;
	}
}

function ChangeTaskDescription(storyID, taskID, desc) {
	/// Requires mantis 1.3.0 at minimum
	if(Mantis.Version() < "1.3.0")
		return;

	Kanban.BlockUpdates = true;
	StartLoading();

	try {
		var newStory = new KanbanStory(Mantis.IssueGet(storyID));
		var taskList = newStory.Tasks;
		if(desc == taskList[taskID].Description)
			return;

		taskList[taskID].Description = desc;
		newStory.Tasks = taskList;

		Mantis.IssueUpdate(newStory.ID, newStory.StorySource);
		newStory = Kanban.UpdateUnderlyingStorySource(newStory, true);
		AddTasksToStoryEditForm(newStory);
		document.getElementById("edit-newtasktext").value = "";
	} catch(e) {
		console.log('ChangeTaskDescription');
		alert("Error Saving Task: " + e.message);
		StopLoading();
	} finally {
		StopLoading();
		Kanban.BlockUpdates = false;
	}

	StopLoading();
}

/*
 * @name AddTasksToStoryEditForm
 * @param {KanbanStory} KanbanStory The story to display the tasks for
 * @description Adds existing task to the edit for of a story
 */
function AddTasksToStoryEditForm(KanbanStory) {

	/// Requires mantis 1.3.0 at minimum
	if(Mantis.Version() < "1.3.0")
		return;

	var taskContainer = document.getElementById("edit-story-tasks-container");
	var taskSaveButton = document.getElementById("edit-story-new-task-save-button");

	try {
		while(taskContainer.childNodes.length > 0) {
			taskContainer.removeChild(taskContainer.firstChild);
		}
	} catch(e) {
	}

	taskSaveButton.setAttribute("onclick", "SaveNewTask(" + KanbanStory.ID + ", document.getElementById('edit-newtasktext').value);");

	if(KanbanStory.Tasks === undefined)
		return;

	for(var i = 0; i < KanbanStory.Tasks.length; i++) {
		var thisTask = KanbanStory.Tasks[i];

		var taskDiv = document.createElement("div");
		taskDiv.setAttribute("class", "taskcontainer");
		taskDiv.setAttribute("storyid", KanbanStory.ID);


		var taskCompleted = document.createElement("input");
		taskCompleted.setAttribute("type", "checkbox");
		taskCompleted.setAttribute("storyid", KanbanStory.ID);
		if(thisTask.Status == "complete") {
			taskCompleted.setAttribute("checked", "");
		}
		taskCompleted.setAttribute("onmouseup", "ChangeTaskStatus(" + KanbanStory.ID + ", " + i + ", !this.checked);");
		///TODO: update task field when unchecking and checking
		taskDiv.appendChild(taskCompleted);

		var taskTextDiv = document.createElement("div");
		taskTextDiv.setAttribute("class", "tasktext");
		if(thisTask.Status == "complete") {
			taskTextDiv.setAttribute("style", "text-decoration: line-through;");
		}
		taskTextDiv.innerHTML = thisTask.Description;
		taskTextDiv.setAttribute("onclick", "this.setAttribute('editing', 'true');this.contentEditable='true'; document.execCommand('selectAll',false,null);");
		taskTextDiv.setAttribute("onblur", "ChangeTaskDescription(" + KanbanStory.ID + ", " + i + ", this.innerHTML);this.contentEditable='false';this.setAttribute('editing', 'false');");
		//taskTextDiv.setAttribute("style", GetStyleCodeFor3Digits(thisTask.reporter.name.substring(0, 3), .8));
		taskDiv.appendChild(taskTextDiv);

		taskContainer.appendChild(taskDiv);
	}
}

/*
 * @name AddNotesToStoryEditForm
 * @param {KanbanStory} KanbanStory The story to display the notes for
 * @description Adds existing notes to the edit for of a story
 */
function AddNotesToStoryEditForm(KanbanStory) {
	var notesContainer = document.getElementById("edit-story-notes-container");
	var noteSaveButton = document.getElementById("edit-story-new-note-save-button");
	var noteTextArea = document.getElementById("edit-newnotetext");
	try {
		while(notesContainer.childNodes.length > 0) {
			notesContainer.removeChild(notesContainer.firstChild);
		}
	} catch(e) {
	}

	noteSaveButton.setAttribute("onclick", "SaveNewNote(" + KanbanStory.ID + ", document.getElementById('edit-newnotetext').value);")
	noteTextArea.addEventListener("onkeydown", function(e) {
		if((keyCode == 10 || keyCode == 13) && event.ctrlKey) {
			SaveNewNote(" + KanbanStory.ID + ", noteTextArea.value);
		}
	});

	if(KanbanStory.Notes === undefined)
		return;

	for(var i = 0; i < KanbanStory.Notes.length; i++) {
		var thisNote = KanbanStory.Notes[i];

		var noteDiv = document.createElement("div");
		noteDiv.setAttribute("class", "notecontainer");
		noteDiv.setAttribute("storyid", KanbanStory.ID);
		if(thisNote.reporter.name === undefined)
			thisNote.reporter.name = "User " + thisNote.reporter.id;
		noteDiv.setAttribute("style", GetStyleCodeFor3Digits(thisNote.reporter.name.substring(0, 3), .8));

		var noteDate = new Date(Date.parse(thisNote.date_submitted));

		var divNoteHeader = document.createElement("div");
		divNoteHeader.setAttribute("class", "noteheader gravatarcontainer");
		divNoteHeader.innerHTML = "<b>" + thisNote.reporter.real_name + "<br> " + noteDate.toLocaleString() + "</b>";
		divNoteHeader.style.backgroundImage = "url(" + get_gravatar_image_url(thisNote.reporter.email, 40) + ")";

		noteDiv.appendChild(divNoteHeader);

		var noteTextDiv = document.createElement("div");
		noteTextDiv.setAttribute("class", "notetext");
		noteTextDiv.innerHTML = "<hr class='noteHorizonalRule'>" + thisNote.text;
		noteDiv.appendChild(noteTextDiv);

		notesContainer.appendChild(noteDiv);
	}
}


/*
 * @name AddHistoryToStoryEditForm
 * @param {KanbanStory} KanbanStory The story to display the histories for
 * @description Adds existing histories to the edit for of a story
 */
function AddHistoryToStoryEditForm(KanbanStory) {
	var historysContainer = document.getElementById("edit-story-historys-container");

	try {
		while(historysContainer.childNodes.length > 0) {
			historysContainer.removeChild(historysContainer.firstChild);
		}
	} catch(e) {
	}

	Kanban.ProjectUsers;
	//console.log(Kanban._currentUser);
	KanbanStory.GetHistoriesAsync(function(histories) {
		for(var i = 0; i < histories.length; i++) {
			var thisHistory = histories[i];

			// <xsd:element name="date" type="xsd:integer"/>
			// <xsd:element name="userid" type="xsd:integer"/>
			// <xsd:element name="username" type="xsd:string"/>
			// <xsd:element name="field" type="xsd:string"/>
			// <xsd:element name="type" type="xsd:integer"/>
			// <xsd:element name="old_value" type="xsd:string"/>
			// <xsd:element name="new_value" type="xsd:string"/>

			var historyDiv = document.createElement("div");
			historyDiv.setAttribute("class", "historycontainer");

			var historyDate = new Date(thisHistory.date * 1000);

			var historyTextDiv = document.createElement("div");
			historyTextDiv.setAttribute("class", "historytext");
			historyTextDiv.innerHTML = "<b>" + thisHistory.username + " : " + historyDate.toLocaleString() + "</b>";
			historyDiv.appendChild(historyTextDiv);

			var historyInnerHtml = HistoryHtml(thisHistory);
			var historyActionDiv = document.createElement("div");
			historyActionDiv.setAttribute("class", "historyaction tags ");
			historyActionDiv.innerHTML = historyInnerHtml;
			historyDiv.appendChild(historyActionDiv);

			historysContainer.appendChild(historyDiv);
		}
	});

}

function HistoryHtml(thisHistory) {
	var viewField = true;
	var viewValue1 = true;
	var viewValue2 = true;
	var urlValue1 = '';
	var urlValue2 = '';

	var mantistTypeName = Mantis.HistoryUpdateTypes[thisHistory.type];
	var historyInnerHtml = "<span class=\"label label-primary\">" + mantistTypeName + "</span>";
	var currentIssueID = document.getElementById("edit-story-id").value;

	switch(mantistTypeName) {
		case "NORMAL_TYPE":
			break;
		case "BUGNOTE_ADDED":
		case "BUGNOTE_UPDATED":
			viewField = false;
			viewValue2 = false;
			urlValue1 = "http://" + Mantis.ServerHostname + "/view.php?id=" + currentIssueID + "#c" + parseInt(thisHistory.old_value);
			break;
		case "BUG_CLONED_TO":
		case "BUG_CREATED_FROM":
		case "BUG_ADD_RELATIONSHIP":
		case "BUG_DEL_RELATIONSHIP":
		case "BUG_REPLACE_RELATIONSHIP":
			viewField = false;
			viewValue1 = false;
			urlValue2 = "http://" + Mantis.ServerHostname + "/view.php?id=" + thisHistory.new_value;
			break;
		case "TAG_ATTACHED":
		case "TAG_DETACHED":
		case "FILE_ADDED":
		case "FILE_DELETED":
			viewField = false;
			viewValue2 = false;
			break;
		case "TAG_RENAMED":
			viewField = false;
			break;
		case "NEW_BUG":
		case "BUG_DELETED":
		case "BUG_MONITOR":
		case "BUG_UNMONITOR":
		case "STEP_TO_REPRODUCE_UPDATED":
		case "ADDITIONAL_INFO_UPDATED":
		case "DESCRIPTION_UPDATED":
		case "BUGNOTE_DELETED":
		default:
			viewField = false;
			viewValue1 = false;
			viewValue2 = false;
			break
	}

	if(viewField) {
		historyInnerHtml += ":";
		historyInnerHtml += "<span class=\"label label-warning\">" + HistoryTranslateField(thisHistory.field) + "</span>";
	}

	if(viewValue1) {
		historyInnerHtml += viewField ? "--" : ':';
		historyInnerHtml += HistoryCreateLink(urlValue1, thisHistory.field, thisHistory.old_value, "label-danger");
	}

	if(viewValue2) {
		historyInnerHtml += "=>";
		historyInnerHtml += HistoryCreateLink(urlValue2, thisHistory.field, thisHistory.new_value, "label-success");
	}

	return historyInnerHtml;
}

function HistoryCreateLink(url, field, value, label) {
	var target = (url.length > 0) ? " target=\"_new\" " : '';
	var htmlPrefix = (url.length > 0) ? "<a href=\"" + url + "\"" + target + "" : "<span ";
	var htmlPostif = (url.length > 0) ? "</a>" : "</span>";
	var labelType = (url.length > 0) ? "label-info" : label;

	return htmlPrefix + "class=\"label " + labelType + "\">" + HistoryFieldReplaceValue(field, value) + htmlPostif;
}

function HistoryTranslateField(field) {
	var fieldName = field;

	switch(field) {
		case "status":
			fieldName = langObj.textStatus;
			break;
		case "handler_id":
			fieldName = langObj.textHandler;
			break;
		case "summary":
			fieldName = langObj.textSummary;
			break;
		case "resolution":
			fieldName = langObj.textResolution;
			break;
		case "sticky":
			fieldName = langObj.textSticky;
			break;
		case "project_id":
			fieldName = langObj.textProjectID;
			break;
		case "category":
			fieldName = langObj.textCategory;
			break;
		case "severity":
			fieldName = langObj.textSeverity;
			break;
		case "priority":
			fieldName = langObj.textPriority;
			break;
		case "reporter_id":
			fieldName = langObj.textReporter;
			break;
		default:
			break;
	}

	return fieldName;
}

function HistoryFieldReplaceValue(field, value) {
	var valueName = value;

	switch(field) {
		case "status":
			valueName = langObj.Status[value];
			break;
		case "handler_id":
		case "reporter_id":
			valueName = Kanban._projectUsers[value];
			break;
		case "resolution":
			valueName = langObj.Resolution[value];
			break;
		case "sticky":
			value = (null == value || 0 == value) ? 0 : 1;
			valueName = langObj.Sticky[value];
			break;
		case "summary":
		default:
			break;
	}

	return valueName;
}

function AddHistoryToStoryEditFormCallback(KanbanStory) {

}

function SearchForStory(localOnly) {
	if(localOnly == undefined)
		localOnly = false;

	var issueID = document.getElementById("searchfield").value;
	var foundIssue = GetStoryIfLoaded(issueID);

	if(foundIssue == null && (localOnly == undefined || !localOnly)) {
		GetStoryIfNotLoaded(issueID, function(returnObj) {
			if(returnObj == undefined || (returnObj.name != undefined && returnObj.name == "Error")) {
				document.getElementById("searchfield").value = "";
				alert("Issue not found!");
				return;
			}

			if(document.getElementById("searchfield").value == urlParams.issue) {
				/// the issue we are trying to load is coming from the querystring, so don't prompt the user, just switch projects
				document.getElementById("seletedproject").value = returnObj.project.id;
				SelectProject();
			} else if(confirm("Issue is in a different project, would you like to switch?")) {
				document.getElementById("seletedproject").value = returnObj.project.id;
				SelectProject();
			}
		});
	} else if(foundIssue != null) {
		EditStory(issueID);
		document.getElementById("searchfield").value = "";
	} else if(localOnly) {
		alert("Unable to open issue, probably its closed and we don't support editing it yet.");
	}
}

function GetStoryIfLoaded(issueID) {
	for(var iid = 0; iid < Kanban.Stories.length; iid++) {
		var thisStory = Kanban.Stories[iid];
		if(thisStory.ID == issueID) {
			return thisStory;
		}
	}
	return null;
}

function GetStoryIfNotLoaded(issueID, callBack) {
	if(callBack == undefined) {
		//// Sync call
		return Mantis.IssueGet(issueID);
	} else {
		/// Async call
		Mantis.IssueGet(issueID, callBack);
	}
}



function OpenAddStory() {
	log("OpenAddStory Called");

	$("#add-summary").val("");
	$("#add-description").val("");
	Kanban.RefreshTimeLocalStorage();
	//document.getElementById("add-summary").value = "";
	//document.getElementById("add-description").value = "";

	var selectReportingUser = document.getElementById("add-reporter");
	selectReportingUser.options.length = 0;
	var selectAssignedUser = document.getElementById("add-assignedto");
	selectAssignedUser.options.length = 0;
	var selectAddStatus = document.getElementById("add-status");
	selectAddStatus.options.length = 0;
	var selectAddCustomField = document.getElementById("add-custom-field");
	selectAddCustomField.options.length = 0;
	var selectAddPriority = document.getElementById("add-priority");
	selectAddPriority.options.length = 0;
	var selectAddCategories = document.getElementById("add-category");
	selectAddCategories.options.length = 0;

	for(var i = 0; i < Kanban.CurrentProject.Users.length; i++) {
		var user = Kanban.CurrentProject.Users[i];
		selectReportingUser.options[selectReportingUser.options.length] = new Option(user.Name, user.ID);
		if(Kanban.CurrentUser.ID == user.ID) {
			selectReportingUser.selectedIndex = i;
		}
	}

	selectAssignedUser.options[selectAssignedUser.options.length] = new Option("None", "");
	for(var i = 0; i < Kanban.CurrentProject.Users.length; i++) {
		var user = Kanban.CurrentProject.Users[i];
		var name = user.Name == undefined ? "ID: " + user.ID : user.Name;
		selectAssignedUser.options[selectAssignedUser.options.length] = new Option(name, user.ID);
	}
	selectAssignedUser.selectedIndex = 0;

	if(Kanban.UsingCustomField) {
		for(var i = 0; i < Mantis.ProjectCustomFields.length; i++) {
			var custom_field = Mantis.ProjectCustomFields[i];
			if(custom_field.field.name == Kanban._listIDField && custom_field.field.name != Mantis.TaskListField) {
				var possiblevalues = custom_field.possible_values.split("|");
				for(var pv = 0; pv < possiblevalues.length; pv++) {
					selectAddCustomField.options[selectAddCustomField.options.length] = new Option(possiblevalues[pv], possiblevalues[pv]);
				}
			}
		}
		$("#add-custom-field-container").show();
	} else {
		$("#add-custom-field-container").hide();
	}

	for(var i = 0; i < Mantis.Statuses.length; i++) {
		var status = Mantis.Statuses[i];
		var statusName = (langObj.Status[status.id] === undefined) ? status.name.capitalize() : langObj.Status[status.id];
		selectAddStatus.options[selectAddStatus.options.length] = new Option(statusName, status.id);
	}
	selectAddStatus.selectedIndex = 0;

	for(var i = 0; i < Mantis.Priorities.length; i++) {
		var priority = Mantis.Priorities[i];
		var priorityName = (langObj.Priority[priority.id] === undefined) ? priority.name.capitalize() : langObj.Priority[priority.id];
		selectAddPriority.options[selectAddPriority.options.length] = new Option(priorityName, priority.id);
	}
	selectAddPriority.selectedIndex = 0;

	var foundDefaultCategory = false;
	for(var i = 0; i < Mantis.ProjectCategories.length; i++) {
		var category = Mantis.ProjectCategories[i];
		if(category == null)
			continue;
		selectAddCategories.options[selectAddCategories.options.length] = new Option(category.capitalize(), category);
		if(Kanban.DefaultCategory != undefined) {
			if(Kanban.DefaultCategory == category) {
				foundDefaultCategory = true;
				selectAddCategories.selectedIndex = i;
			}
		}
	}
	if(!foundDefaultCategory)
		selectAddCategories.selectedIndex = 0;

	console.log('Add new issue');
	if(Kanban.UsingCustomField) {
		var toInsert = "";
		for(var i = 0; i < Mantis.ProjectCustomFields.length; i++) {
			var custom_field = Mantis.ProjectCustomFields[i];
			if(custom_field.field.name != Kanban._listIDField && custom_field.field.name != Mantis.TaskListField) {
				var inputField = '<input type="text" name="add-' + custom_field.field.name + '" id="add-' + custom_field.field.name + '" class="form-control input-small" />';
				toInsert += '<div class="control-group"><label class="control-label" for="add-' + custom_field.field.name + '">' + custom_field.field.name + ':</label><div class="controls">' + inputField + '</div></div>';

// TODO: analysis required
//				if (custom_field.possible_values != null) {
//					var possiblevalues = custom_field.possible_values.split("|");
//
//					inputField = '<select name="add-' + custom_field.field.name + '" id="add-' + custom_field.field.name + '" class="form-control input-small">';
//					for (var pv = 0; pv < possiblevalues.length; pv++) {
//						inputField += '<option value="' + possiblevalues[pv] + '">' + possiblevalues[pv] + '</option>';
//					}
//					inputField += '</select>';
//				}
			}
		}
		document.getElementById("customAdd").innerHTML = toInsert;
	}

	ShowAddStory();
}

function UpdateStoryHandler(storyID, handlerID) {
	Kanban.BlockUpdates = true;
	StartLoading();

	Mantis.IssueGet(storyID, function(kanbanStory) {
		try {
			kanbanStory.HandlerID = handlerID;
			Kanban.LastUpdateStoryID = kanbanStory.ID;
			Mantis.IssueUpdate(kanbanStory.ID, kanbanStory.StorySource, UpdateStoryHandlerComplete);
			$("#user-context-menu").hide();
		} catch(e) {
			alert(e);
		} finally {
			Kanban.BlockUpdates = false;
			StopLoading();
		}
	});
}

function UpdateStoryHandlerComplete(result) {
	Kanban.BlockUpdates = false;
	StopLoading();
	if(result != "true") {
		alert("Error Updating: " + result);
	} else {
		try {
			var foundStory = Kanban.GetStoryByFieldValue("ID", Kanban.LastUpdateStoryID);
			if(foundStory !== null) {
				foundStory = Kanban.UpdateUnderlyingStorySource(foundStory);

				if(foundStory.ProjectID != Kanban.CurrentProject.ID) {
					foundStory.Element.parentNode.removeChild(foundStory.Element);
					return;
				}

				///If its null, then we werent' editing the story, just dropping between the lists

				//var newFoundStory = Kanban.GetStoryByFieldValue("ID", foundStory.ID);
				foundStory.BuildKanbanStoryDiv();
				foundStory.JoinList();
				foundStory.Element.classList.add("nofadein");
			}
		} catch(e) {
			console.log(e);
		}

		Kanban.UndoInfo.ListDiv = null;
		Kanban.UndoInfo.StoryDiv = null;
	}
}

/**
 * Displays the edit form of a particular story
 * @param {[type]} storyID ID of the story to edit
 */
function EditStory(storyID) {
	document.getElementById("edit-story-notes-container").scrollTop = document.getElementById("edit-story-notes-container").clientHeight;

	$('a[href=#tabs-1]').tab('show');
	ClearUploadList();
	Kanban.RefreshTimeLocalStorage();

	var thisStory = Kanban.GetStoryByFieldValue("ID", storyID);

	document.getElementById("editing-header").style.backgroundImage = "url(" + get_gravatar_image_url(thisStory.AssignedToUser.Email, 80) + ")";

	/// Thanks to todace for sample code https://github.com/todace
	document.getElementById("edit-story-title").innerHTML = "<a target=\"_new\" class=\"btn btn-primary\" href=http://" + Mantis.ServerHostname + "/view.php?id=" + thisStory.ID + ">" + thisStory.ID + "</a> &nbsp; " + (thisStory.Summary.length > 40 ? thisStory.Summary.substring(0, 37) + "..." : thisStory.Summary);
	$("#edit-story-id").val(thisStory.ID);
	$("#edit-summary").val(thisStory.Summary);
	$("#edit-description").val(thisStory.Description);
	$("#edit-reproduce").val(thisStory.Reproduce);

	$("#edit-newnotetext").val("");

	document.getElementById("edit-datesubmitted").innerHTML = thisStory.DateSubmitted;

	var selectReportingUser = document.getElementById("edit-reporter");
	selectReportingUser.options.length = 0;
	var selectAssignedUser = document.getElementById("edit-assignedto");
	selectAssignedUser.options.length = 0;
	var selectAddStatus = document.getElementById("edit-status");
	selectAddStatus.options.length = 0;
	var selectEditCategory = document.getElementById("edit-category");
	selectEditCategory.options.length = 0;
	var selectAddPriority = document.getElementById("edit-priority");
	selectAddPriority.options.length = 0;
	var selectEditSeverity = document.getElementById("edit-severity");
	selectEditSeverity.options.length = 0;
	var selectEditResolution = document.getElementById("edit-resolution");
	selectEditResolution.options.length = 0;
	var selectStoryProject = document.getElementById("edit-project");
	selectStoryProject.options.length = 0;

	for(var i = 0; i < Kanban.Projects.length; i++) {
		var project = Kanban.Projects[i];
		selectStoryProject.options[selectStoryProject.options.length] = new Option(Array(project.ProjectNiv).join("--") + project.Name, project.ID);
		if(thisStory.ProjectID !== undefined && project.ID == thisStory.ProjectID) {
			selectStoryProject.selectedIndex = i;
		}
	}

// TODO: analysis required
//	var hasBeenSelected = false;
	for(var i = 0; i < Kanban.CurrentProject.Users.length; i++) {
		var user = Kanban.CurrentProject.Users[i];
		selectReportingUser.options[selectReportingUser.options.length] = new Option(user.Name, user.ID);
		if(thisStory.ReporterID !== undefined && user.ID == thisStory.ReporterID) {
			selectReportingUser.selectedIndex = i;
//			hasBeenSelected = true;
		}
	}

//	if (!hasBeenSelected) {
//		selectReportingUser.options[selectReportingUser.options.length] = new Option(thisStory.ReporterName, thisStory.ReporterID);
//		selectReportingUser.selectedIndex = selectReportingUser.options.length - 1;
//	}

	///Add a blank option
	selectAssignedUser.options[selectAssignedUser.options.length] = new Option(langObj.textAssignToNoOne, "");
	for(var i = 0; i < Kanban.CurrentProject.Users.length; i++) {
		var user = Kanban.CurrentProject.Users[i];
		selectAssignedUser.options[selectAssignedUser.options.length] = new Option(user.Name, user.ID);
		if(thisStory.HandlerID !== undefined && user.ID == thisStory.HandlerID) {
			selectAssignedUser.selectedIndex = i + 1;
		}
	}

	for(var i = 0; i < Mantis.Statuses.length; i++) {
		var status = Mantis.Statuses[i];
		var statusName = (langObj.Status[status.id] === undefined) ? status.name.capitalize() : langObj.Status[status.id];
		selectAddStatus.options[selectAddStatus.options.length] = new Option(statusName, status.id);
		if(thisStory.StatusID == status.id) {
			selectAddStatus.selectedIndex = i;
		}
	}

	for(var i = 0; i < Mantis.Priorities.length; i++) {
		var priority = Mantis.Priorities[i];
		var priorityName = (langObj.Priority[priority.id] === undefined) ? priority.name.capitalize() : langObj.Priority[priority.id];
		selectAddPriority.options[selectAddPriority.options.length] = new Option(priorityName, priority.id);
		if(thisStory.PriorityID == priority.id) {
			selectAddPriority.selectedIndex = i;
		}
	}

	selectEditSeverity.options[selectEditSeverity.options.length] = new Option(langObj.textSetDefault, "");
	for(var i = 0; i < Mantis.Severities.length; i++) {
		var severity = Mantis.Severities[i];
		var severityName = (langObj.Severity[severity.id] === undefined) ? severity.name.capitalize() : langObj.Severity[severity.id];
		selectEditSeverity.options[selectEditSeverity.options.length] = new Option(severityName, severity.id);
		if(thisStory.SeverityID == severity.id) {
			selectEditSeverity.selectedIndex = i + 1;
		}
	}

	selectEditResolution.options[selectEditResolution.options.length] = new Option(langObj.textSetDefault, "");
	for(var i = 0; i < Mantis.Resolutions.length; i++) {
		var resolution = Mantis.Resolutions[i];
		var resolutionName = (langObj.Resolution[resolution.id] === undefined) ? resolution.name.capitalize() : langObj.Resolution[resolution.id];
		selectEditResolution.options[selectEditResolution.options.length] = new Option(resolutionName, resolution.id);
		if(thisStory.ResolutionID == resolution.id) {
			selectEditResolution.selectedIndex = i + 1;
		}
	}

	for(var i = 0; i < Mantis.ProjectCategories.length; i++) {
		var category = Mantis.ProjectCategories[i];
		if(category == null)
			category = "";
		selectEditCategory.options[selectEditCategory.options.length] = new Option(category.capitalize(), category);
		if(thisStory.CategoryID == category) {
			selectEditCategory.selectedIndex = i;
		}
	}

	/// Requires mantis 1.3.0 at minimum
	if(Mantis.Version() > "1.3.0")
		AddTasksToStoryEditForm(thisStory);

	/// Requires mantis 1.3.0 at minimum
	if(Mantis.Version() > "1.3.0")
		AddHistoryToStoryEditForm(thisStory);

	AddNotesToStoryEditForm(thisStory);
	AddAttachmentToStoryEditForm(thisStory);
	AddTagsToStoryEditForm(thisStory);

	if(Kanban.UsingCustomField) {
		var toInsert = "";
		for(var i = 0; i < Mantis.ProjectCustomFields.length; i++) {
			var custom_field = Mantis.ProjectCustomFields[i];
			if(custom_field.field.name != Kanban._listIDField && custom_field.field.name != Mantis.TaskListField) {
				var currentValue = "";
				for(var iq = 0; iq < thisStory.StorySource.custom_fields.length; iq++) {
					var customField = thisStory.StorySource.custom_fields[iq];
					if(customField.field.name == custom_field.field.name) {
						currentValue = (thisStory.StorySource.custom_fields[iq].value != null) ? thisStory.StorySource.custom_fields[iq].value : "";
					}
				}

				var inputField = '<input type="text" name="edit-' + custom_field.field.name + '" id="edit-' + custom_field.field.name + '" class="form-control input-small" value="' + currentValue + '" />';
				toInsert += '<div class="control-group col-xs-6"><label class="control-label" for="edit-' + custom_field.field.name + '">' + custom_field.field.name + ':</label><div class="controls">' + inputField + '</div></div>';

// TODO: analysis required
//				if (custom_field.possible_values != null) {
//					var possiblevalues = custom_field.possible_values.split("|");
//
//					inputField = '<select name="edit-' + custom_field.field.name + '" id="edit-' + custom_field.field.name + '" class="form-control input-small">';
//					for (var pv = 0; pv < possiblevalues.length; pv++) {
//						inputField += '<option value="' + possiblevalues[pv] + '"' + ((possiblevalues[pv] == currentValue) ? ' selected' : '') + '>' + possiblevalues[pv] + '</option>';
//					}
//					inputField += '</select>';
//				}
			}
		}
		document.getElementById("customEdit").innerHTML = toInsert;
	}

	ShowEditStory();

}




function ToggleLegend() {
	var value = document.getElementById("contentarea").getAttribute("showingpriority");
	var toggle = ("true" == value) ? "false" : "true";
	document.getElementById("contentarea").setAttribute("showingpriority", toggle);
}

function ShowLegend() {
	document.getElementById("contentarea").setAttribute("showingpriority", "true");
}

function HideLegend() {
	document.getElementById("contentarea").setAttribute("showingpriority", "false");
}

function ShowSettings() {
	CloseAddStory();
	CloseEditStory();
	Kanban.LoadRuntimeSettings();
	document.getElementById("edit-settings-form").setAttribute("editing", "true");
	document.getElementById("edit-settings-form").style.visibility = "visible";
	document.getElementById("kanbancontent").setAttribute("editing", "true");
	document.getElementById("settings-autofit-onresize").checked = DefaultSettings.autoResizeColumns;

	var settingsThemesChooser = document.getElementById("settings-selectedTheme");
	settingsThemesChooser.options.length = 0;

	var selecteStyle = 0;

	if(DefaultSettings.selectedStyle)
		selectedStyle = DefaultSettings.selectedStyle;

	for(var q = 0; q < Kanban.Themes.length; q++) {
		var thisTheme = Kanban.Themes[q];

		settingsThemesChooser.options[q] = new Option(thisTheme.name, q);
	}

	settingsThemesChooser.selectedIndex = selectedStyle;
}

function CloseSettings() {
	document.getElementById("kanbancontent").setAttribute("editing", "false");
	document.getElementById("edit-settings-form").style.visibility = "hidden";
	document.getElementById("edit-settings-form").setAttribute("editing", "false");
}

function ShowEditStory() {
	CloseAddStory();
	CloseSettings();
	document.getElementById("kanbancontent").setAttribute("editing", "true");
	document.getElementById("edit-story-form").style.visibility = "visible";
	document.getElementById("edit-story-form").setAttribute("editing", "true");
}

function ShowAddStory() {
	CloseEditStory();
	CloseSettings();
	document.getElementById("add-story-form").style.visibility = "visible";
	document.getElementById("add-story-form").setAttribute("editing", "true");
	document.getElementById("kanbancontent").setAttribute("editing", "true");
}

function CloseEditStory() {
	document.getElementById('kanbancontent').setAttribute('editing', 'false');
	document.getElementById("edit-story-form").setAttribute("editing", "false");
	document.getElementById("edit-story-form").style.visibility = "hidden";
}

function CloseAddStory() {
	document.getElementById('kanbancontent').setAttribute('editing', 'false');
	document.getElementById("add-story-form").style.visibility = "hidden";
	document.getElementById("add-story-form").setAttribute("editing", "false");
}