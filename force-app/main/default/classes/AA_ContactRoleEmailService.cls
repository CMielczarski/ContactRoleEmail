public with sharing class AA_ContactRoleEmailService {
    @AuraEnabled
	public static list<ContentVersion> getContentFiles(){
		list<ContentVersion> fileList = new list<ContentVersion>();
		for(ContentVersion cv: [SELECT ID, ContentDocumentID, TagCsv, IsLatest, FileType, ContentSize, Title FROM ContentVersion WHERE isLatest = true ORDER BY Title]){
			if(cv.TagCsv != null){
				fileList.add(cv);
				}
			}
		system.debug('fileList: ' + fileList);
		return fileList;
        }
        
    @AuraEnabled
    public static list<EmailTemplate> getEmailTemplates(){
        list<EmailTemplate> templateList = new list<EmailTemplate>();
        templateList = [SELECT Id, Body, Subject FROM EmailTemplate];
        system.debug('templateList: ' + templateList);
        return templateList;
        }

	@AuraEnabled
	public static sObject getRecord(string id){
		try{
			system.debug('ID: ' + id);
			//Opportunity
			if(id.startsWith('006')){
				Opportunity a = new Opportunity();
				a = [SELECT ID, Designated_Contact__c, Designated_Contact__r.Email FROM Opportunity WHERE ID =: id];
				sObject r = a;
				return r;
				}
			else{
                system.debug('Somoehow initiated from wrong object');
                }
			}
		catch(exception e){
			system.debug('Unexpected Object Type');
			return null;
			}
		return null;	
        }
        
    @AuraEnabled
    public static list<Contact> getContactList(string id){
        list<Contact> ctcs = new list<Contact>();
        try{
            list<ID> conIDs = new list<ID>();
            for(OpportunityContactRole ocr: [SELECT ID, ContactID FROM OpportunityContactRole WHERE OpportunityID =: id]){
                conIDs.add(ocr.ContactID);
                }
                ctcs =  [SELECT ID, FirstName, LastName, Title, Email FROM Contact WHERE ID IN: conIDs AND Email != null];
                return ctcs;
            }
        catch(exception e){
            system.debug('Error: ' + e.getMessage() + ' Line: ' + e.getLineNumber());
            return null;
            }
        }

	@AuraEnabled
	public static string sendEmail(ID parentID, list<string> sendToEmailIDs, string subject, string body, list<string> files, list<string> libraryFiles){
		string result;
		ID orgID = UserInfo.getOrganizationId();
		//string replyEmail;
		//Production
		if(orgID == '00D30000000Ygz3'){
			//replyEmail = 'rehabcare_service@c-2bv2avze3owwx89d4vwtaesisp0vu9pxvzn4jc5fzwaz7r8o9l.3-ygz3eac.na131.apex.salesforce.com';		
			}
		//Current QA
		else if(orgID == '00D2h0000008aJn'){
			//replyEmail = 'rehabcare_service@u-khki49s87hrb4vhxfzaqee5m2cve4ecpn900vs2dzoo3m696n.2h-8ajneai.cs36.apex.sandbox.salesforce.com';
            }
        List<Messaging.SingleEmailMessage> messages =   new List<Messaging.SingleEmailMessage>();
        // Define the email
        map<Id,string> sendToEmail = new map<ID,string>();
        list<Contact> ctcs = new list<Contact>();
        for(Contact ctc : [SELECT ID, Email FROM Contact WHERE ID IN: sendToEmailIDs]){
            sendToEmail.put(ctc.ID, ctc.Email);
            }
        

        for(ID i: sendToEmail.keySet()){
		    Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage(); 
            set<string> cleanSet = new set<string>();
            string rcp = sendToEmail.get(i);
		    system.debug('files: ' + files);
		    cleanSet.addAll(files);
		    list<string> cleanFiles = new list<string>();
		    cleanFiles.addAll(cleanSet);
		    String address = rcp;
		    system.debug('emailAddr: ' + rcp);
		    if((rcp != null && !string.isBlank(rcp))){
			    String[] toAddress = new String []{};
			    if(rcp != null && !string.isBlank(rcp)){
				    string[] listSplit = rcp.split(',', 0);
				    toAddress.addAll(listSplit);
				    }
			    // Sets the paramaters of the email
			    email.setSubject(subject);
			    email.setToAddresses(toAddress);
			    email.setHtmlBody(body);
			
			    list<Messaging.Emailfileattachment> efaList = new list<Messaging.Emailfileattachment>();
			    system.debug('cleanFiles: ' + cleanFiles);
			    if(cleanFiles.size() > 0){
				    List<id> ContentDocumentids = new List<id>();
				    for(contentDocumentLink CDLink : [SELECT LinkedEntityid, ContentDocumentid FROM contentDocumentLink WHERE ContentDocumentId IN: cleanFiles]){
					    ContentDocumentids.add(CDLink.ContentDocumentid);  
					    }
				    for(ContentVersion cversion : [SELECT Title, 
													      PathOnClient, FileType, FileExtension,
													      versionData, ContentDocumentId 
											              FROM ContentVersion 
											              WHERE ContentDocumentId IN :ContentDocumentids]){
					    blob WOCFbody = cversion.versiondata;
					    system.debug('body : '+WOCFbody+' Title: ' + cversion.title);
					    Messaging.Emailfileattachment efa = new Messaging.Emailfileattachment();
					    efa.setFileName(cversion.title + '.' + cversion.FileExtension);
					    efa.setBody(WOCFbody);
					    efaList.add(efa);
					    }
				    }

			    system.debug('libraryFiles: ' + libraryFiles);	
			    if(libraryFiles.size() > 0){
				    List<id> ContentDocumentids = new List<id>();
				    for(contentDocumentLink CDLink : [SELECT LinkedEntityid, ContentDocumentid FROM contentDocumentLink WHERE ContentDocumentId IN: libraryFiles]){
					    ContentDocumentids.add(CDLink.ContentDocumentid);  
					    }
				    for(ContentVersion cversion : [SELECT Title, 
					    								  PathOnClient, FileType, FileExtension,
						    							  versionData 
							    				   FROM ContentVersion 
								    			   WHERE ContentDocumentId IN :ContentDocumentids]){
					    blob WOCFbody = cversion.versiondata;
					    system.debug('body : '+WOCFbody+' Title: '+cversion.title);
					    Messaging.Emailfileattachment efa = new Messaging.Emailfileattachment();
					    efa.setFileName(cversion.title + '.' + cversion.FileExtension);
					    efa.setBody(WOCFbody);
					    efaList.add(efa); 
			 		    }
				    }
			    email.setFileAttachments(efaList);
			    email.setTargetObjectId(i);
			    email.setSaveAsActivity(true);
			    email.setUseSignature(true);
                messages.add(email);
                }
            }
        try{
            Messaging.SendEmailResult[] results = Messaging.sendEmail(messages);
			system.debug('r: ' + results);
			result = 'Message(s) Sent Successfully';
            }
        catch(Exception E){
            result = 'Error: ' + e.getMessage() + ' Line: ' + e.getLineNumber();
            }
        return result;
		}

	@AuraEnabled
	public static list<string> insertHTML(string templateId){
		list<string> template = new list<string>();

		EmailTemplate et = [SELECT Id, Body, Subject FROM EmailTemplate WHERE ID =: templateID LIMIT 1];
		template.add(et.Subject);
		template.add(et.Body);

		return template;   
		}
		
	
}
