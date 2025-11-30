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
	Spinner,
	Grid,
} from "@radix-ui/themes";
import { Label } from "@radix-ui/react-label";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	Cross2Icon,
	HamburgerMenuIcon,
	MoonIcon,
	SunIcon,
} from "@radix-ui/react-icons";
import "@radix-ui/themes/styles.css";
import { useDropzone } from "react-dropzone";
import { Toaster, toast } from "sonner";
import OpenAI from "openai";
import { Document, Page, pdfjs } from "react-pdf";
// Configuring PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

type FileData = {
	file: File;
	desiredFileLength: "1 page" | "2 pages";
	numPages?: number;
	pageNumber: number;
};

export default function App() {
	const [showSidebar, setShowSidebar] = useState(true);
	const [lightMode, setLightMode] = useState(true);
	const [apiKey, setApiKey] = useState("");
	const [files, setFiles] = useState<FileData[]>([]);
	const [jobDescription, setJobDescription] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [suggestions, setSuggestions] = useState<any>({});

	const onDrop = useCallback((acceptedFiles: File[]) => {
		for (const file of acceptedFiles) {
			if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
				toast.error("Only PDF and DOCX files are accepted");
				continue;
			}

			setFiles((prev) => [
				...prev,
				{ file, desiredFileLength: "1 page", pageNumber: 1 },
			]);
		}
	}, []);
	const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

	const customizeDocuments = useCallback(async () => {
		if (!apiKey) {
			toast.error("Please enter an API key");
			return;
		}
		if (!jobDescription) {
			toast.error("Please enter a job description");
			return;
		}
		if (files.length === 0) {
			toast.error("Please enter at least one file");
			return;
		}

		setIsLoading(true);

		try {
			const filePromises = files.map((f) => {
				return new Promise((resolve) => {
					const reader = new FileReader();

					reader.onload = function (fileLoadedEvent) {
						const base64String = String(fileLoadedEvent.target?.result).split(
							","
						)[1]; // Remove data URL prefix

						resolve({
							type: "file",
							file: {
								filename: f.file.name,
								file_data: `data:application/pdf;base64,${base64String}`,
							},
						});
					};

					reader.readAsDataURL(f.file);
				});
			});
			const fileList = await Promise.all(filePromises);

			const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

			const completion = await client.chat.completions.create({
				model: "gpt-4o",
				messages: [
					{
						role: "user",
						content: [
							{
								type: "text",
								text: `You are an assistant that helps people customize their application material (resume, cover letter, etc.) for differ positions.
								You will be provided a list of files and a job description, and you need to make concise actionable suggestions (Write this..., Rewrite this to this..., Delete this...) to tailor the document to the position.
								Here are the file names and their target lengths (they're likely too long initially): \n${files
									.map(
										(file) =>
											`File name: ${file.file.name}, Target length: ${file.desiredFileLength}\n`
									)
									.join(
										""
									)}\n Don't hallucinate experiences or projects that aren't in the files and respond ONLY with the suggestions in this JSON format:

								{
									"file name 1": ["suggestion1", "suggestion2"],
									"file name 2": ["suggestion3", "suggestion4"]
								}`,
							},
							...(fileList as any),
						],
					},
				],
			});
			const json = JSON.parse(completion.choices[0].message.content ?? "");
			setSuggestions(json);
		} catch (err) {
			toast.error(
				"Failed to customize documents. Check your API key and try again."
			);
		} finally {
			setIsLoading(false);
		}
	}, [apiKey, jobDescription, files]);

	return (
		<Theme
			appearance={lightMode ? "light" : "dark"}
			accentColor="jade"
			style={{ display: "flex" }}
		>
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
    					#sidebar {
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
    					  #sidebar {
    					    width: 100vw;
    					  }
    					}
  `}
			</style>
			<Box id="sidebar">
				<Heading as="h1" size="5" style={{ marginLeft: 64, paddingBottom: 24 }}>
					Application Helper
				</Heading>
				<IconButton
					style={{ position: "absolute", top: 24, right: 24 }}
					onClick={() => setLightMode(!lightMode)}
					variant="surface"
				>
					{lightMode ? <SunIcon color="black" /> : <MoonIcon color="white" />}
				</IconButton>
				<ScrollArea style={{ maxHeight: "90%" }}>
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
							<ScrollArea style={{ maxHeight: "200px" }}>
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
											<Select.Root
												size="1"
												value={fileData.desiredFileLength}
												onValueChange={(newValue: "1 page" | "2 pages") =>
													setFiles((prev) =>
														prev.map((f) => {
															if (f === fileData) {
																return {
																	...f,
																	desiredFileLength: newValue,
																};
															} else {
																return f;
															}
														})
													)
												}
											>
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
				</ScrollArea>
			</Box>
			<style>
				{`main {
							justify-content: center;
							width: 100%;
							display: flex;
							padding-left: ${showSidebar ? "350px" : "50px"};
							padding-right: ${showSidebar ? "0px" : "50px"};
							transition: 0.3s;
						}

						@media (max-width: 768px) {
    					  main {
						  padding-left: 0px;
						  padding-right: 0px;
    					    ${showSidebar && "visibility: hidden;"}
    					  }
    					}
						
						.main-headers {
							display: flex;
							justify-content: space-between;
							align-items: center;
							margin-bottom: 20px;
						}

						@media (max-width: 768px) {
    					  .main-headers {
						  flex-direction: column;
    					}
						  .scan-button {
						 	margin-top: 16px;
							margin-bottom: 16px;
						  }

						  .main-header {
						 	margin-left: 24px;
							margin-bottom: 12px;
						  }
					}
						`}
			</style>
			<main>
				<ScrollArea style={{ maxHeight: "100vh" }}>
					<Flex
						style={{ width: "100%" }}
						p="4"
						px="6"
						align="center"
						direction="column"
					>
						<Flex
							align="center"
							justify="center"
							py="4"
							mb="4"
							className="main-headers"
						>
							<Heading as="h1" className="main-header">
								Select Files
							</Heading>
							<Button
								onClick={customizeDocuments}
								disabled={isLoading}
								style={{ marginLeft: "24px" }}
								className="scanButton"
							>
								{isLoading ? (
									<>
										Loading <Spinner />
									</>
								) : (
									"Customize Documents"
								)}
							</Button>
						</Flex>
						{files.length > 0 ? (
							<Grid gap="4">
								{files.map((fileData) => (
									<Card key={`card-${fileData.file.name}`}>
										<Heading as="h4" mb="2">
											{fileData.file.name}
										</Heading>
										<Document
											file={fileData.file}
											onLoadSuccess={({ numPages }: { numPages: number }) => {
												setFiles((prev) =>
													prev.map((f) => {
														if (f === fileData) {
															return { ...f, numPages };
														} else {
															return f;
														}
													})
												);
											}}
										>
											<ScrollArea>
												<Page
													pageNumber={fileData.pageNumber}
													renderTextLayer={false}
													renderAnnotationLayer={false}
												/>
											</ScrollArea>
											<Flex align="center" justify="center" pb="2" pt="4">
												<Flex p="2">
													<IconButton
														disabled={fileData.pageNumber <= 1}
														onClick={() =>
															setFiles((prev) =>
																prev.map((f) => {
																	if (f === fileData) {
																		return {
																			...f,
																			pageNumber: f.pageNumber - 1,
																		};
																	} else {
																		return f;
																	}
																})
															)
														}
													>
														<ArrowLeftIcon />
													</IconButton>
													<Box px="4">
														{fileData.pageNumber} of {fileData.numPages}
													</Box>
													<IconButton
														disabled={fileData.pageNumber === fileData.numPages}
														onClick={() =>
															setFiles((prev) =>
																prev.map((f) => {
																	if (f === fileData) {
																		return {
																			...f,
																			pageNumber: f.pageNumber + 1,
																		};
																	} else {
																		return f;
																	}
																})
															)
														}
													>
														<ArrowRightIcon />
													</IconButton>
												</Flex>
											</Flex>
											{suggestions[fileData.file.name] && (
												<Card style={{ width: "600px" }}>
													<ScrollArea style={{ maxHeight: "200px" }}>
														{suggestions[fileData.file.name].map(
															(s: string, index: number) => (
																<Card mb="2" key={`suggestion-${s}`}>
																	<Heading as="h4" size="2">
																		Suggestion {index + 1}:{" "}
																	</Heading>
																	<Text as="p" size="2">
																		{s}
																	</Text>
																</Card>
															)
														)}
													</ScrollArea>
												</Card>
											)}
										</Document>
									</Card>
								))}
							</Grid>
						) : (
							<Card
								style={{
									textAlign: "center",
									padding: "3rem",
									width: "100%",
									maxWidth: "900px",
								}}
							>
								<Text size="5" as="p" mb="4">
									No files selected
								</Text>
								<Text as="p" color="gray">
									Upload PDF files using the sidebar.
								</Text>
							</Card>
						)}
					</Flex>
				</ScrollArea>
			</main>
		</Theme>
	);
}
