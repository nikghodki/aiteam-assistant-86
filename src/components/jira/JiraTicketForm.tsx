
import React, { useState, useEffect } from 'react';
import { Ticket, CheckCircle2, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jiraApi, JiraProject, JiraIssueType } from '@/services/api';

interface JiraTicketFormProps {
  onTicketCreated: () => void;
  onCancel?: () => void;
}

const JiraTicketForm = ({ onTicketCreated, onCancel }: JiraTicketFormProps) => {
  const { toast } = useToast();
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([]);
  const [selectedIssueType, setSelectedIssueType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingIssueTypes, setIsLoadingIssueTypes] = useState(false);

  // Fetch projects when component mounts
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch Jira projects
  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const projectsData = await jiraApi.getProjects();
      setProjects(projectsData);
      
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0].key);
        // Fetch issue types for the first project
        fetchIssueTypes(projectsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Add fallback mock projects
      const mockProjects: JiraProject[] = [
        { id: 'DEMO-1', key: 'DEMO', name: 'Demo Project' },
        { id: 'ENG-1', key: 'ENG', name: 'Engineering' },
        { id: 'OPS-1', key: 'OPS', name: 'Operations' }
      ];
      setProjects(mockProjects);
      setSelectedProject('DEMO');
      
      // Also set mock issue types
      const mockIssueTypes: JiraIssueType[] = [
        { id: 'BUG-1', name: 'Bug' },
        { id: 'TASK-1', name: 'Task' },
        { id: 'STORY-1', name: 'Story' }
      ];
      setIssueTypes(mockIssueTypes);
      setSelectedIssueType('Bug');
    } finally {
      setIsLoadingProjects(false);
    }
  };
  
  // Fetch issue types for a project
  const fetchIssueTypes = async (projectId: string) => {
    setIsLoadingIssueTypes(true);
    try {
      const issueTypesData = await jiraApi.getIssueTypes(projectId);
      setIssueTypes(issueTypesData);
      
      if (issueTypesData.length > 0) {
        setSelectedIssueType(issueTypesData[0].name);
      }
    } catch (error) {
      console.error('Error fetching issue types:', error);
      
      // Add fallback mock issue types
      const mockIssueTypes: JiraIssueType[] = [
        { id: 'BUG-1', name: 'Bug' },
        { id: 'TASK-1', name: 'Task' },
        { id: 'STORY-1', name: 'Story' }
      ];
      setIssueTypes(mockIssueTypes);
      setSelectedIssueType('Bug');
    } finally {
      setIsLoadingIssueTypes(false);
    }
  };

  const handleProjectChange = (projectKey: string) => {
    setSelectedProject(projectKey);
    
    // Find project by key and fetch issue types
    const project = projects.find(p => p.key === projectKey);
    if (project) {
      fetchIssueTypes(project.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!summary.trim()) {
      toast({
        title: "Error",
        description: "Please provide a ticket summary.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create a ticket using the API
      await jiraApi.createTicket({
        summary,
        description,
        priority,
        project: selectedProject,
        issueType: selectedIssueType
      });
      
      // Reset form
      setSummary('');
      setDescription('');
      setPriority('Medium');
      
      // Notify parent component
      onTicketCreated();
      
      toast({
        title: "Success",
        description: "Jira ticket created successfully.",
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create Jira ticket.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border/30 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Ticket className="mr-2 h-5 w-5 text-primary" />
          Create New Ticket
        </h3>
        {onCancel && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="summary">Summary</Label>
          <Input
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief summary of the issue"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select
              value={selectedProject}
              onValueChange={handleProjectChange}
              disabled={isLoadingProjects}
            >
              <SelectTrigger className="w-full text-left">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent align="start">
                {isLoadingProjects ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-xs">Loading...</span>
                  </div>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.key}>
                      {project.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="issueType">Issue Type</Label>
            <Select
              value={selectedIssueType}
              onValueChange={setSelectedIssueType}
              disabled={isLoadingIssueTypes}
            >
              <SelectTrigger className="w-full text-left">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent align="start">
                {isLoadingIssueTypes ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-xs">Loading...</span>
                  </div>
                ) : (
                  issueTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={priority}
              onValueChange={setPriority}
            >
              <SelectTrigger className="w-full text-left">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the issue"
            rows={4}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Create Ticket
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default JiraTicketForm;
