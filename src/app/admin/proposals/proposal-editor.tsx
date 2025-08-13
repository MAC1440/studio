
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  type User,
  type Proposal,
  type Comment,
  type Project,
} from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { Zap } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { generateProposal } from "@/ai/flows/proposal-flow";

type ProposalEditorProps = {
  clients: User[];
  projects: Project[];
  onSave: (data: {
    title: string;
    content: string;
    clientId: string;
    projectId: string;
    status: Proposal["status"];
  }) => void;
  onClose: () => void;
  proposal: Proposal | null;
  isSubmitting: boolean;
};

function FeedbackComment({ comment }: { comment: Comment }) {
  const commentTimestamp =
    comment.timestamp && "toDate" in comment.timestamp
      ? comment.timestamp.toDate()
      : (comment.timestamp as Date);

  return (
    <div key={comment.id} className="flex gap-3">
      <Avatar>
        <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} />
        <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 rounded-md border bg-muted/50 p-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{comment.user.name}</span>
          <span className="text-xs text-muted-foreground">
            {commentTimestamp
              ? formatDistanceToNow(commentTimestamp, { addSuffix: true })
              : "just now"}
          </span>
        </div>
        <p className="text-sm text-foreground/80 mt-1 whitespace-pre-wrap">
          {comment.message}
        </p>
      </div>
    </div>
  );
}

function AiGeneratorDialog({ open, onOpenChange, onGenerate, isGenerating }: { open: boolean, onOpenChange: (open: boolean) => void, onGenerate: (prompt: string) => void, isGenerating: boolean}) {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(prompt);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> AI Proposal Generator</DialogTitle>
                    <DialogDescription>
                        Describe the proposal you want to create, and the AI will generate a structured draft for you.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ai-prompt">Proposal Topic</Label>
                        <Textarea 
                            id="ai-prompt"
                            placeholder="e.g., 'A full website redesign for a local coffee shop' or 'A social media marketing campaign for a new clothing brand'"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={isGenerating}
                            rows={3}
                        />
                    </div>
                     <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isGenerating}>Cancel</Button>
                        <Button type="submit" disabled={isGenerating || !prompt.trim()}>
                            {isGenerating ? 'Generating...' : 'Generate Content'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function ProposalEditor({
  clients,
  projects,
  onSave,
  onClose,
  proposal,
  isSubmitting,
}: ProposalEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (proposal) {
      setTitle(proposal.title || "");
      setContent(proposal.content || "");
      setClientId(proposal.clientId || "");
      setProjectId(proposal.projectId || "");
    } else {
      setTitle("");
      setContent("");
      setClientId("");
      setProjectId("");
    }
  }, [proposal]);

  const handleSubmit = (status: Proposal["status"]) => {
    try {
      onSave({ title, content, clientId, projectId, status });
    } catch (e) {
      console.error("Failed to save from editor", e);
      toast({ title: "An unexpected error occurred", variant: "destructive" });
    }
  };

  const handleAiGenerate = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const result = await generateProposal({ prompt });
      if (result.content) {
        setContent(result.content);
        setTitle(prompt); // Use the prompt as a starting title
        toast({ title: 'AI content generated!', description: 'The editor has been updated with the generated proposal.' });
        setIsAiDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to generate AI content:", error);
      toast({ title: "AI Generation Failed", description: "Could not generate content. Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }

  const isFormValid = title && clientId && projectId && content;
  const isViewOnly =
    proposal && !["draft", "changes-requested"].includes(proposal.status);
  const hasFeedback =
    proposal && proposal.feedback && proposal.feedback.length > 0;

  return (
    <>
    <div className="flex flex-col h-full overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {proposal
            ? isViewOnly
              ? "View Proposal"
              : "Edit Proposal"
            : "Create New Proposal"}
        </DialogTitle>
      </DialogHeader>

      <div className="flex flex-col flex-1 py-4 overflow-y-auto min-h-0">
        <div className="space-y-4 px-1 flex flex-col flex-1 h-[90%]">
          {hasFeedback && (
            <div className="space-y-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
              <h3 className="font-semibold text-amber-700 dark:text-amber-400">
                Client Feedback
              </h3>
              <div className="space-y-4">
                {proposal.feedback?.map((comment, index) => (
                  <FeedbackComment key={index} comment={comment} />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Proposal Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Website Design & Development"
                disabled={isSubmitting || Boolean(isViewOnly)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                onValueChange={setProjectId}
                value={projectId}
                disabled={isSubmitting || Boolean(isViewOnly)}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select
              onValueChange={setClientId}
              value={clientId}
              disabled={isSubmitting || Boolean(isViewOnly)}
            >
              <SelectTrigger id="client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between">
                 <Label>Content</Label>
                 {!isViewOnly && (
                    <Button variant="outline" size="sm" onClick={() => setIsAiDialogOpen(true)}>
                        <Zap className="mr-2 h-4 w-4 text-primary" />
                        Generate with AI
                    </Button>
                 )}
            </div>
            <RichTextEditor
              content={content}
              onChange={setContent}
              editable={
                // !isSubmitting && 
                !isViewOnly}
            />
          </div>
        </div>
      </div>
      <DialogFooter className="mt-auto pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          {isViewOnly ? "Close" : "Cancel"}
        </Button>
        {!isViewOnly && (
          <div className="flex gap-2">
            {proposal?.status !== "changes-requested" && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleSubmit("draft")}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save as Draft"}
              </Button>
            )}
            <Button
              type="button"
              onClick={() => handleSubmit("sent")}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting
                ? "Sending..."
                : proposal?.status === "changes-requested"
                ? "Update & Re-send"
                : proposal
                ? "Update & Send"
                : "Save & Send"}
            </Button>
          </div>
        )}
      </DialogFooter>
    </div>
    <AiGeneratorDialog 
        open={isAiDialogOpen}
        onOpenChange={setIsAiDialogOpen}
        onGenerate={handleAiGenerate}
        isGenerating={isGenerating}
    />
    </>
  );
}
