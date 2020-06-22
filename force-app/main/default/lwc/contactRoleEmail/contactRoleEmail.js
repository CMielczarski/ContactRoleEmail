import { LightningElement, api } from 'lwc';

import getContentFiles from '@salesforce/apex/AA_ContactRoleEmailService.getContentFiles';
import getEmailTemplates from '@salesforce/apex/AA_ContactRoleEmailService.getEmailTemplates';
import getContactList from '@salesforce/apex/AA_ContactRoleEmailService.getContactList';
import getRecord from '@salesforce/apex/AA_ContactRoleEmailService.getRecord';
import sendEmail from '@salesforce/apex/AA_ContactRoleEmailService.sendEmail';
import insertHTML from '@salesforce/apex/AA_ContactRoleEmailService.insertHTML';
import formFactor from '@salesforce/client/formFactor';

export default class ContactRoleEmail extends LightningElement {

@api subject;
@api body;
@api contentFileList = [];
@api selectedFiles = [];
@api selectedTemplate = [];
@api accept = "['.jpg', '.jpeg' , '.doc', '.docx', '.pdf', '.msg', '.txt', '.html', '.htm', '.png', '.csv', '.xlsx', '.xlsm', '.xltx', '.xltm', '.ppsx', '.ppt', '.pptm', '.pptx']";
@api selectedAttachments = [];
@api Spinner = false;
@api recordId;
@api showForm = false;
@api isMobile = false;
@api sendButtonDisabled = false;
@api conList = [];
@api templateList = [];
@api selectedEmails = [];

    connectedCallback(){
        this.sendButtonDisabled = true;
        console.log('Experience: ' + formFactor);
        if(formFactor !== 'Large'){
            this.isMobile = true;
            }
        getRecord({
                    "id" : this.recordId
                    })
                .then(
                    result=>{
                        var stringItems = result;
                        console.log('Record: ' + stringItems);
                            getContentFiles()
                            .then(
                                result=>{
                                    var stringItems = result;
                                    console.log('File List: ' + stringItems[0].Title);
                                    var newList = [];
                                    if(stringItems !== null){
                                    for(var i = 0; i < stringItems.length; i++){
                                        var strng = stringItems[i].Title + ', ' + stringItems[i].FileType;
                                        newList.push({ value: stringItems[i].ContentDocumentId, label: strng});
                                        }
                                        }
                                        this.contentFileList = newList;
                                        getContactList({
                                                        "id" : this.recordId
                                                        }
                                                )
                                                .then(
                                                    result=>{
                                                        var stockData = result;
                                                        var tempList = [];
                                                        if(stockData !== null){
                                                        for(var i = 0; i < stockData.length; i++){
                                                            var strng = stockData[i].FirstName + ' ' + stockData[i].LastName + ', ' + stockData[i].Title;
                                                            tempList.push({value: stockData[i].Id, label: strng});
                                                            }
                                                            }
                                                            this.conList = tempList;
                                                            getEmailTemplates()
                                                                .then(
                                                                    result=>{
                                                                        this.templateList = result;
                                                                        }
                                                                    )
                                                                .catch(
                                                                    error=>{
                                                                        console.log('Error fetching template list: ' + error.message);
                                                                        }
                                                                    );
                                                        }
                                                    )
                                                .catch(
                                                    error=>{
                                                        console.log('Error fetching contact list: ' + error.message);
                                                        }
                                                    );
                                        }
                                )
                            .catch(
                                error=>{
                                    console.log('Error fetching content files: ' + error.message);
                                    }
                            );
                        }
                        )
                .catch(
                    error=>{
                        console.log('Error fetching record: ' + error.message);
                    }
                );
        }

        handleInputChange(event){
            var name = event.target.name;
            if(name === 'toUserAdd'){
                this.toUserAdditional = event.target.value;
                }
            if(name === 'subject'){
                this.subject = event.target.value;
                }
            if(name === 'body'){
                this.body = event.target.value;
                }
            }
    
        changeHandler(event){
            var evt = event.target.name;
            var evtVal = event.target.value;
            if(evt === 'subj'){
                this.evtSubj = evtVal;
                }
            else if(evt === 'typeSelect'){
                this.evtType = evtVal;
                }
            else if(evt === 'evtPrivate'){
                this.evtPrivate = evtVal;
                }
            else if(evt === 'evtStart'){
                this.evtStart = evtVal;
                }
            else if(evt === 'evtEnd'){
                this.evtEnd = evtVal;
                }
            else if(evt === 'evtLoc'){
                this.evtLoc = evtVal;
                }
            else if(evt === 'statusSelect'){
                this.evtStatus = evtVal;
                }
            }
    
        newPopup(){
            this.activeClass = 'slds-modal slds-fade-in-open slds-modal_large';
            this.activeClass2 = 'slds-backdrop--open';
            this.showForm = true;
            getContactList({
                "id" : this.recordId
                }
                )
                .then(
                    result=>{
                        var stockData = result;
                        var tempList = [];
                        if(stockData !== null){
                            for(var i = 0; i < stockData.length; i++){
                                var strng = stockData[i].FirstName + ' ' + stockData[i].LastName + ', ' + stockData[i].Title;
                                tempList.push({value: stockData[i].Id, label: strng});
                                }
                            }
                            this.conList = tempList;
                            }
                    )
                .catch(
                    error=>{
                        console.log('Error fetching contact list: ' + error.message);
                        }
                    );
            }
        
        closeNewModal(){
            this.activeClass = null;
            this.activeClass2 = null;
            this.showForm = false;
            }
        
        sendMail(){
            this.Spinner = true;
            sendEmail({
                        'parentID': this.recordId,
                        'sendToEmailIDs': this.selectedEmails,
                        'subject' : this.subject,
                        'files' : this.selectedAttachments,
                        'libraryFiles' : this.selectedFiles,
                        'body' : this.body,
                        })
                        .then(
                            result=>{
                                console.log('Send result: ' + result);
                                this.Spinner = false;
                                alert(result);
                                this.subject = "";
                                this.body = "";
                                this.toUserAdditional = "";
                                this.contentFileList = null;
                                this.selectedFiles = null;
                                this.selectedTemplate = "";
                                this.selectedAttachments = null;
                                this.closeNewModal();
                                }
                        )
                        .catch(
                            error=>{
                                this.Spinner = false;
                                alert("There was an issue sending the email, please check entries and try again. " + error.message);
                            }
                        );
            }
        
        insertHTML(){
            insertHTML({
                        'selectedTemplate' : this.selectedTemplate
                        }
                        )
                    .then(
                        result=>{
                            console.log('Result from server-->>> ' + result);
                            var stockData = result;
                            this.subject = stockData[0];
                            this.body = stockData[1];
                            }
                        )
                    .catch(
                        error=>{
                            console.log("Template Get Error: " + error.message);
                            }
                        );
            }
        
        onLibraryChange(event){
            var selectedOptionsList = event.target.value;
            console.log('Files: ' + selectedOptionsList);
            this.selectedFiles = selectedOptionsList;
            }

        onContactListChange(event){
            var selectedOptionsList = event.target.value;
            console.log('Contacts: ' + selectedOptionsList);
            this.selectedEmails = selectedOptionsList;
            if(this.selectedEmails.length > 0){
                this.sendButtonDisabled = false;
                }
            else{
                this.sendButtonDisabled = true;
                }
            }
        
        onHTMLChange(event){
            var selectedOptionsList = event.target.value;
            console.log(selectedOptionsList);
            this.selectedTemplate = selectedOptionsList;
            }
        
        handleUploadFinished(event){
            // Get the list of uploaded files
            var uploadedFiles = event.detail.files;
            for(var i = 0; i < uploadedFiles.length; i++){
                this.selectedAttachments.push(uploadedFiles[i].documentId);
                }
            console.log('FileList: ' + this.selectedAttachments);
            }
}