// App.tsx
import React, { useState, useCallback } from "react";
import { Button, Select, TextArea, Theme } from "@radix-ui/themes";
import { Label } from "@radix-ui/react-label";
import { Loader2 } from "lucide-react";
import "@radix-ui/themes/styles.css";

const App: React.FC = () => {
	const [apiKey, setApiKey] = useState("");
	const [resume, setResume] = useState("");
	const [coverLetter, setCoverLetter] = useState("");
	const [jobDescription, setJobDescription] = useState("");
	const [pageLength, setPageLength] = useState<"1" | "2">("1");
	const [isLoading, setIsLoading] = useState(false);
	const [result, setResult] = useState<{
		resume: string;
		coverLetter: string;
	} | null>(null);
	const [error, setError] = useState("");

	const customizeDocuments = useCallback(async () => {
		if (!apiKey || !resume || !coverLetter || !jobDescription) {
			setError("Please fill all fields");
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			const response = await fetch(
				"https://api.openai.com/v1/chat/completions",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${apiKey}`,
					},
					body: JSON.stringify({
						model: "gpt-4",
						messages: [
							{
								role: "user",
								content: `Customize my resume and cover letter for this job description, keeping each document to ${pageLength} page(s):

Job Description: ${jobDescription}

Original Resume: ${resume}

Original Cover Letter: ${coverLetter}

Please return the customized resume and cover letter in plain text format, separated by '---'.`,
							},
						],
					}),
				}
			);

			if (!response.ok) throw new Error("API request failed");

			const data = await response.json();
			const [customResume, customCoverLetter] =
				data.choices[0].message.content.split("---");
			setResult({
				resume: customResume.trim(),
				coverLetter: customCoverLetter.trim(),
			});
		} catch (err) {
			setError(
				"Failed to customize documents. Check your API key and try again."
			);
		} finally {
			setIsLoading(false);
		}
	}, [apiKey, resume, coverLetter, jobDescription, pageLength]);

	return (
		<Theme>
			<div className="max-w-7xl mx-auto p-6">
				<h1 className="text-2xl font-bold mb-6">
					Resume & Cover Letter Customizer
				</h1>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-4">
						<div>
							<Label htmlFor="apiKey">OpenAI API Key</Label>
							<TextArea
								id="apiKey"
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								placeholder="Enter your OpenAI API key"
								className="w-full"
							/>
						</div>
						<div>
							<Label htmlFor="resume">Original Resume</Label>
							<TextArea
								id="resume"
								value={resume}
								onChange={(e) => setResume(e.target.value)}
								placeholder="Paste your full resume here"
								className="w-full h-40"
							/>
						</div>
						<div>
							<Label htmlFor="coverLetter">Original Cover Letter</Label>
							<TextArea
								id="coverLetter"
								value={coverLetter}
								onChange={(e) => setCoverLetter(e.target.value)}
								placeholder="Paste your full cover letter here"
								className="w-full h-40"
							/>
						</div>
					</div>
					<div className="space-y-4">
						<div>
							<Label htmlFor="jobDescription">Job Description</Label>
							<TextArea
								id="jobDescription"
								value={jobDescription}
								onChange={(e) => setJobDescription(e.target.value)}
								placeholder="Paste the job description here"
								className="w-full h-40"
							/>
						</div>
						<div className="flex gap-4 items-center">
							<Label>Document Length</Label>
							<Select.Root
								value={pageLength}
								onValueChange={(value: "1" | "2") => setPageLength(value)}
							>
								<Select.Trigger />
								<Select.Content>
									<Select.Item value="1">1 Page</Select.Item>
									<Select.Item value="2">2 Pages</Select.Item>
								</Select.Content>
							</Select.Root>
						</div>
						<Button
							onClick={customizeDocuments}
							disabled={isLoading}
							className="w-full"
						>
							{isLoading ? (
								<>
									<Loader2 className="animate-spin mr-2" /> Customizing...
								</>
							) : (
								"Customize Documents"
							)}
						</Button>
						{error && (
							<div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>
						)}
						{result && (
							<div className="space-y-4">
								<div>
									<h2 className="text-lg font-semibold">Customized Resume</h2>
									<TextArea
										value={result.resume}
										readOnly
										className="w-full h-40"
									/>
								</div>
								<div>
									<h2 className="text-lg font-semibold">
										Customized Cover Letter
									</h2>
									<TextArea
										value={result.coverLetter}
										readOnly
										className="w-full h-40"
									/>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</Theme>
	);
};

export default App;
