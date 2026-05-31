import axios from 'axios';

export interface AzureDevOpsTask {
  id: number;
  title: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  completedWork: number | null;
  status: string;
  workItemType: string;
  assignedTo: string | null;
}

export class AzureDevOpsService {
  private orgUrl: string;
  private project: string;
  private pat: string;
  private authHeader: string;

  constructor() {
    this.orgUrl = process.env.AZURE_DEVOPS_ORG_URL || '';
    this.project = process.env.AZURE_DEVOPS_PROJECT || '';
    this.pat = process.env.AZURE_DEVOPS_PAT || '';
    
    // Create base64 encoded auth header for PAT
    this.authHeader = 'Basic ' + Buffer.from(':' + this.pat).toString('base64');
  }

  /**
   * Fetch tasks from Azure DevOps board for a specific employee
   * @param employeeEmail - Email of the employee to filter tasks
   * @returns Array of Azure DevOps tasks
   */
  async getEmployeeTasks(employeeEmail: string): Promise<AzureDevOpsTask[]> {
    try {
      if (!this.orgUrl || !this.project || !this.pat) {
        console.warn('Azure DevOps credentials not configured');
        return [];
      }

      // WIQL query to fetch tasks assigned to the employee
      const wiqlQuery = {
        query: `
          SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo],
                 [Microsoft.VSTS.Scheduling.CompletedWork],
                 [Microsoft.VSTS.Scheduling.StartDate],
                 [Microsoft.VSTS.Scheduling.FinishDate]
          FROM WorkItems
          WHERE [System.WorkItemType] = 'Task'
            AND [System.AssignedTo] CONTAINS '${employeeEmail}'
            AND [System.State] <> 'Removed'
          ORDER BY [System.ChangedDate] DESC
        `
      };

      // Execute WIQL query
      const wiqlUrl = `${this.orgUrl}/${this.project}/_apis/wit/wiql?api-version=7.0`;
      const wiqlResponse = await axios.post(wiqlUrl, wiqlQuery, {
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json'
        }
      });

      const workItemIds = wiqlResponse.data.workItems.map((item: any) => item.id);

      if (workItemIds.length === 0) {
        return [];
      }

      // Fetch work item details
      const workItemsUrl = `${this.orgUrl}/${this.project}/_apis/wit/workitems?ids=${workItemIds.join(',')}&fields=System.Id,System.Title,System.State,System.AssignedTo,System.WorkItemType,Microsoft.VSTS.Scheduling.CompletedWork,Microsoft.VSTS.Scheduling.StartDate,Microsoft.VSTS.Scheduling.FinishDate&api-version=7.0`;
      
      const workItemsResponse = await axios.get(workItemsUrl, {
        headers: {
          'Authorization': this.authHeader
        }
      });

      // Map work items to our task format
      const tasks: AzureDevOpsTask[] = workItemsResponse.data.value.map((item: any) => ({
        id: item.id,
        title: item.fields['System.Title'],
        actualStartDate: item.fields['Microsoft.VSTS.Scheduling.StartDate'] || null,
        actualEndDate: item.fields['Microsoft.VSTS.Scheduling.FinishDate'] || null,
        completedWork: item.fields['Microsoft.VSTS.Scheduling.CompletedWork'] || null,
        status: item.fields['System.State'],
        workItemType: item.fields['System.WorkItemType'],
        assignedTo: item.fields['System.AssignedTo']?.displayName || null
      }));

      return tasks;
    } catch (error: any) {
      console.error('Error fetching Azure DevOps tasks:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Fetch all tasks from Azure DevOps board (for manager view)
   * @returns Array of Azure DevOps tasks
   */
  async getAllTasks(): Promise<AzureDevOpsTask[]> {
    try {
      if (!this.orgUrl || !this.project || !this.pat) {
        console.warn('Azure DevOps credentials not configured');
        return [];
      }

      // WIQL query to fetch all tasks
      const wiqlQuery = {
        query: `
          SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo],
                 [Microsoft.VSTS.Scheduling.CompletedWork],
                 [Microsoft.VSTS.Scheduling.StartDate],
                 [Microsoft.VSTS.Scheduling.FinishDate]
          FROM WorkItems
          WHERE [System.WorkItemType] = 'Task'
            AND [System.State] <> 'Removed'
          ORDER BY [System.ChangedDate] DESC
        `
      };

      // Execute WIQL query
      const wiqlUrl = `${this.orgUrl}/${this.project}/_apis/wit/wiql?api-version=7.0`;
      const wiqlResponse = await axios.post(wiqlUrl, wiqlQuery, {
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json'
        }
      });

      const workItemIds = wiqlResponse.data.workItems.map((item: any) => item.id);

      if (workItemIds.length === 0) {
        return [];
      }

      // Fetch work item details (Azure DevOps API has a limit of 200 IDs per request)
      const batchSize = 200;
      const batches = [];
      for (let i = 0; i < workItemIds.length; i += batchSize) {
        batches.push(workItemIds.slice(i, i + batchSize));
      }

      const allTasks: AzureDevOpsTask[] = [];

      for (const batch of batches) {
        const workItemsUrl = `${this.orgUrl}/${this.project}/_apis/wit/workitems?ids=${batch.join(',')}&fields=System.Id,System.Title,System.State,System.AssignedTo,System.WorkItemType,Microsoft.VSTS.Scheduling.CompletedWork,Microsoft.VSTS.Scheduling.StartDate,Microsoft.VSTS.Scheduling.FinishDate&api-version=7.0`;
        
        const workItemsResponse = await axios.get(workItemsUrl, {
          headers: {
            'Authorization': this.authHeader
          }
        });

        const tasks: AzureDevOpsTask[] = workItemsResponse.data.value.map((item: any) => ({
          id: item.id,
          title: item.fields['System.Title'],
          actualStartDate: item.fields['Microsoft.VSTS.Scheduling.StartDate'] || null,
          actualEndDate: item.fields['Microsoft.VSTS.Scheduling.FinishDate'] || null,
          completedWork: item.fields['Microsoft.VSTS.Scheduling.CompletedWork'] || null,
          status: item.fields['System.State'],
          workItemType: item.fields['System.WorkItemType'],
          assignedTo: item.fields['System.AssignedTo']?.displayName || null
        }));

        allTasks.push(...tasks);
      }

      return allTasks;
    } catch (error: any) {
      console.error('Error fetching all Azure DevOps tasks:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Test Azure DevOps connection
   * @returns boolean indicating if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.orgUrl || !this.project || !this.pat) {
        return false;
      }

      const testUrl = `${this.orgUrl}/${this.project}/_apis/wit/workitemtypes?api-version=7.0`;
      await axios.get(testUrl, {
        headers: {
          'Authorization': this.authHeader
        }
      });

      return true;
    } catch (error) {
      console.error('Azure DevOps connection test failed:', error);
      return false;
    }
  }
}

export const azureDevOpsService = new AzureDevOpsService();
