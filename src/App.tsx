import { useState, useCallback } from "react";
import {
	Box,
	Button,
	Card,
	IconButton,
	Separator,
	TextArea,
	TextField,
	Theme,
	Text,
	Heading,
	ScrollArea,
	Flex,
	Select,
} from "@radix-ui/themes";
import { Label } from "@radix-ui/react-label";
import {
	Cross2Icon,
	HamburgerMenuIcon,
	MoonIcon,
	SunIcon,
} from "@radix-ui/react-icons";
import "@radix-ui/themes/styles.css";
import { useDropzone } from "react-dropzone";
import { Toaster, toast } from "sonner";

type FileData = {
	file: File;
	desiredFileLength: "1 page" | "2 pages";
};

export default function App() {
	const [showSidebar, setShowSidebar] = useState(true);
	const [apiKey, setApiKey] = useState("");
	const [jobDescription, setJobDescription] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [lightMode, setLightMode] = useState(true);
	const [files, setFiles] = useState<FileData[]>([]);

	const onDrop = useCallback((acceptedFiles: File[]) => {
		for (const file of acceptedFiles) {
			if (
				!(file.type === "application/pdf" && file.name.endsWith(".pdf")) &&
				!(
					file.type ===
						"application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
					file.name.endsWith(".docx")
				)
			) {
				console.log(file.type);
				toast.error("Only PDF and DOCX files are accepted");
				continue;
			}

			setFiles((prev) => [...prev, { file, desiredFileLength: "1 page" }]);
		}
	}, []);
	const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

	const customizeDocuments = useCallback(async () => {
		if (!apiKey || !jobDescription) {
			toast.error("Please fill all fields");
			return;
		}

		setIsLoading(true);

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
								content: `Customize my resume and cover letter for this job description, keeping each document to ${"pageLength"} page(s):

Job Description: ${jobDescription}

Original Resume: ${"resume"}

Original Cover Letter: ${"coverLetter"}

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
			// setResult({
			// 	resume: customResume.trim(),
			// 	coverLetter: customCoverLetter.trim(),
			// });
		} catch (err) {
			toast.error(
				"Failed to customize documents. Check your API key and try again."
			);
		} finally {
			setIsLoading(false);
		}
	}, [apiKey, jobDescription]);

	return (
		<Theme appearance={lightMode ? "light" : "dark"} accentColor="jade">
			<Toaster />

			<IconButton
				onClick={() => setShowSidebar(!showSidebar)}
				style={{
					position: "absolute",
					left: 24,
					top: 24,
					zIndex: 20,
				}}
			>
				<HamburgerMenuIcon />
			</IconButton>
			<style>
				{`
    					.sidebar {
    					  width: 350px;
						  height: 100vh;
    					  padding: 20px;
    					  padding-top: 30px;
    					  border-right: 2px solid var(--slate-6);
    					  transform: ${showSidebar ? "translateX(0%)" : "translateX(-100%)"};
    					  transition: transform 0.3s ease;
						  position: absolute;
						  left: 0;
    					  z-index: 10;
						  background-color: var(--gray-1);
    					}

    					@media (max-width: 768px) {
    					  .sidebar {
    					    width: 100vw;
    					  }
    					}
  `}
			</style>
			<Box id="sidebar" className="sidebar">
				<Heading as="h1" size="5" style={{ marginLeft: 64, paddingBottom: 24 }}>
					Application Helper
				</Heading>
				<IconButton
					style={{ position: "absolute", top: 24, right: 24 }}
					onClick={() => setLightMode(!lightMode)}
				>
					{lightMode ? <SunIcon /> : <MoonIcon />}
				</IconButton>
				<div>
					<Card>
						<Label htmlFor="apiKey">OpenAI API Key</Label>
						<TextField.Root
							placeholder="sk-..."
							id="apiKey"
							onChange={(e) => setApiKey(e.target.value)}
						/>
					</Card>
					<Separator size="4" style={{ marginTop: 24, marginBottom: 24 }} />
					<style>
						{`
						  .dropzone {
							padding: 2rem;
							border: 2px dashed var(--slate-6);
							border-radius: var(--radius-4);
							text-align: center;
							cursor: pointer;
							transition: border-color 0.2s, background-color 0.2s;
						  }
						  
						  .dropzone:hover, .dropzone-active {
							border-color: var(--jade-8);
							background-color: var(--jade-2);
						  }
						  
						  .file-list {
							margin-top: 1rem;
						  }
						  
						  .file {
							padding: 0.5rem;
							border-radius: var(--radius-4);
							margin-bottom: 0.5rem;
							cursor: pointer;
							transition: background-color 0.2s;
							display: flex;
							align-items: center;
						  }
						  
						  .file:hover {
							background-color: var(--slate-3);
						  }
						  
						  .file.selected {
							background-color: var(--iris-3);
						  }
						`}
					</style>
					<div
						{...getRootProps()}
						className={`dropzone ${isDragActive ? "dropzone-active" : ""}`}
					>
						<input {...getInputProps()} />
						{isDragActive ? (
							<Text as="p">Drop files here ...</Text>
						) : (
							<Text as="p">
								Drag 'n' drop some files here, or click to select files
							</Text>
						)}
					</div>
					{files.length > 0 && (
						<Box className="file-list" mt="3">
							<Heading as="h3" size="1" mb="1">
								Uploaded Files
							</Heading>
							<ScrollArea style={{ maxHeight: "150px" }}>
								{files.map((fileData, index) => (
									<Card
										key={`${fileData.file.name}-${index}`}
										style={{ marginTop: 4 }}
									>
										<Flex align="center" justify="between">
											<Text>{fileData.file.name}</Text>{" "}
											<IconButton
												variant="soft"
												onClick={() => {
													setFiles((prev) =>
														prev.filter((f) => f !== fileData)
													);
												}}
											>
												<Cross2Icon />
											</IconButton>
										</Flex>
										<Flex align="center">
											<Label style={{ fontSize: 12, paddingRight: 4 }}>
												Target Length:{" "}
											</Label>
											<Select.Root size="1" value={fileData.desiredFileLength}>
												<Select.Trigger />
												<Select.Content>
													<Select.Item value="1 page">1 page</Select.Item>
													<Select.Item value="2 pages">2 pages</Select.Item>
												</Select.Content>
											</Select.Root>
										</Flex>
									</Card>
								))}
							</ScrollArea>
						</Box>
					)}
					<Separator size="4" style={{ marginTop: 24, marginBottom: 24 }} />
					<Card>
						<Label htmlFor="jobDescription">Job Description</Label>
						<TextArea
							id="jobDescription"
							value={jobDescription}
							onChange={(e) => setJobDescription(e.target.value)}
							placeholder="Paste the job description here"
						/>
					</Card>

					<Button
						onClick={customizeDocuments}
						disabled={isLoading}
						style={{ marginTop: 24, width: "100%" }}
					>
						{isLoading ? (
							<>{/* <Loader2 /> Customizing... */}</>
						) : (
							"Customize Documents"
						)}
					</Button>
				</div>
			</Box>
		</Theme>
	);
}
