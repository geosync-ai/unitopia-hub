import React, { useState, useEffect, useRef, ChangeEvent, FocusEvent, MouseEvent as ReactMouseEvent } from 'react';
import Draggable from 'react-draggable';
import { Groq } from 'groq-sdk';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import HtmlLicensePreview from '../components/HtmlLicensePreview';

interface FormData {
  issuedDate: string;
  expiryDate: string;
  licenseNumber: string;
  licenseeName: string;
  regulatedActivity: string;
  legalReference: string;
  signatoryName: string;
  signatoryTitle: string;
}

interface ElementStyleProperties {
  x: number;
  y: number;
  fontSize?: number;
  width?: number;
  height?: number;
  fontWeight?: string | number;
  letterSpacing?: number;
  color?: string;
  fontFamily?: string;
  backgroundColor?: string;
  borderRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  zIndex?: number;
}

interface AllElementStyles {
  [key: string]: ElementStyleProperties;
}

// Define types for different views
type MainView = 'dashboard' | 'create' | 'settings' | 'admin';

const PREVIEW_SIZES = {
  ORIGINAL_DESIGN: { width: 800, height: 565, name: 'Original (800x565px)' }, // Approx A4 aspect ratio
  A4_LANDSCAPE: { width: 1122, height: 794, name: 'A4 Landscape (1122x794px @96DPI)' },
  A3_LANDSCAPE: { width: 1587, height: 1122, name: 'A3 Landscape (1587x1122px @96DPI)' },
  CUSTOM: { width: 800, height: 565, name: 'Custom Dimensions' } // Default custom to original
};

const LicensingRegistry: React.FC = () => {
  const initialFormData: FormData = {
    issuedDate: "DD/MM/YYYY",
    expiryDate: "DD/MM/YYYY",
    licenseNumber: "CMLXXXXXX",
    licenseeName: "Enter Licensee Name",
    regulatedActivity: "ADVISING ON CORPORATE FINANCE",
    legalReference: "Section 14, Capital Markets and Services Act 2007",
    signatoryName: "John Doe",
    signatoryTitle: "Director of Licensing",
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);

  const [activeAiConfigTab, setActiveAiConfigTab] = useState<string>('general');
  
  // New state for AI Configuration General Tab
  const [aiProvider, setAiProvider] = useState<string>('Groq');
  const [aiModel, setAiModel] = useState<string>('meta-llama/llama-4-scout-17b-16e-instruct');
  const [apiKey, setApiKey] = useState<string>('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');

  // New state for managing the active main view
  const [activeMainView, setActiveMainView] = useState<MainView>('create');

  // State for License Type dropdown (kept for AI pre-fill)
  const licenseTypes = [
    'Advising on Corporate Finance',
    'Dealing in Securities',
    'Fund Managment',
    'Investment Advise',
    'Trustee'
  ];
  const [selectedLicenseType, setSelectedLicenseType] = useState<string>(licenseTypes[0]);

  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState<boolean>(false);

  const availableFontFamilies = [
    // Add the custom fonts first
    'Montserrat',
    'LedSledStraight',
    // Standard fonts
    'Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS', 'Times New Roman', 'Georgia', 'Garamond', 'Courier New', 'Brush Script MT'
  ];

  // Updated initial styles with new properties
  const initialElementStyles: AllElementStyles = {
    "headerLogo": { "x": 30, "y": 21, "width": 89, "height": 89, "zIndex": 10, "fontFamily": "Montserrat" },
    "securitiesCommissionText": { "x": 72, "y": 31, "fontSize": 22, "fontWeight": "bold", "color": "#000000", "letterSpacing": 3.8, "fontFamily": "Montserrat", "zIndex": 1, "width": 300, "height": 30 },
    "ofPapuaNewGuineaText": { "x": 79, "y": 49, "fontSize": 16, "fontWeight": "normal", "color": "#333333", "letterSpacing": 0, "fontFamily": "Montserrat", "zIndex": 1, "width": 250, "height": 25 },
    "issuedLabelText": { "x": 318, "y": 24, "fontSize": 10, "fontWeight": "normal", "color": "#888888", "letterSpacing": 0, "fontFamily": "Montserrat", "zIndex": 1, "width": 100, "height": 20 },
    "issuedDateText": { "x": 343, "y": 25, "fontSize": 10, "fontWeight": "normal", "color": "#D32F2F", "letterSpacing": 0, "fontFamily": "LedSledStraight", "zIndex": 1, "width": 100, "height": 20 },
    "expiryLabelText": { "x": 318, "y": 32, "fontSize": 10, "fontWeight": "normal", "color": "#888888", "letterSpacing": 0, "fontFamily": "Montserrat", "zIndex": 1, "width": 100, "height": 20 },
    "expiryDateText": { "x": 685, "y": 66, "fontSize": 10, "fontWeight": "normal", "color": "#D32F2F", "letterSpacing": 0, "fontFamily": "LedSledStraight", "zIndex": 1, "width": 100, "height": 20 },
    "licenseNumberHeaderText": { "x": 318, "y": 63, "fontSize": 14, "fontWeight": "bold", "color": "#000000", "letterSpacing": 1, "fontFamily": "LedSledStraight", "zIndex": 1, "width": 150, "height": 25 },
    "capitalMarketActText": { "x": 28, "y": 141, "fontSize": 14, "fontWeight": "bold", "color": "#111111", "letterSpacing": 0.5, "fontFamily": "Montserrat", "zIndex": 1, "width": 220, "height": 25 },
    "actDetailsText": { "x": 32, "y": 161, "fontSize": 10, "fontWeight": "normal", "color": "#222222", "letterSpacing": 0.2, "fontFamily": "Montserrat", "zIndex": 1, "width": 220, "height": 40 },
    "sidebarPara1StaticText": { "x": 31, "y": 198, "fontSize": 10, "fontWeight": "normal", "color": "#222222", "letterSpacing": 0.2, "fontFamily": "Montserrat", "zIndex": 1, "width": 200, "height": 60 },
    "sidebarRegulatedActivityText": { "x": 24, "y": 247, "fontSize": 10, "fontWeight": "bold", "color": "#222222", "letterSpacing": 0.2, "fontFamily": "Montserrat", "zIndex": 1, "width": 200, "height": 40 },
    "sidebarPara2Text": { "x": 35, "y": 273, "fontSize": 10, "fontWeight": "normal", "color": "#222222", "letterSpacing": 0.2, "fontFamily": "Montserrat", "width": 205, "zIndex": 1, "height": 80 },
    "qrCode": { "x": 67, "y": 407, "width": 100, "height": 100, "zIndex": 10, "fontFamily": "Montserrat" },
    "verticalGoldLine": { "x": 279, "y": 129, "width": 3, "height": 350, "backgroundColor": "#d4af37", "zIndex": 15, "fontFamily": "Montserrat" },
    "mainTitleBanner": { "x": 399, "y": 167, "height": 50, "width": 400, "backgroundColor": "#000000", "zIndex": 5, "borderTopLeftRadius": 20, "borderTopRightRadius": 0, "borderBottomLeftRadius": 20, "borderBottomRightRadius": 0, "fontFamily": "Montserrat" },
    "mainLicenseTitleText": { "x": 473, "y": 176, "fontSize": 20, "fontWeight": "bold", "color": "#FFFFFF", "letterSpacing": 1, "fontFamily": "Montserrat", "zIndex": 6, "width": 300, "height": 30 },
    "grantedToLabelText": { "x": 352, "y": 240, "fontSize": 12, "fontWeight": "normal", "color": "#555555", "letterSpacing": 0, "fontFamily": "Montserrat", "zIndex": 1, "width": 100, "height": 20 },
    "granteeNameText": { "x": 425, "y": 255, "fontSize": 28, "fontWeight": "bold", "color": "#D32F2F", "letterSpacing": 0, "fontFamily": "Montserrat", "zIndex": 1, "width": 350, "height": 40 },
    "regulatedActivityMainText": { "x": 389, "y": 358, "fontSize": 12, "fontWeight": "bold", "color": "#000000", "letterSpacing": 0, "fontFamily": "Montserrat", "zIndex": 1, "width": 300, "height": 40 },
    "legalReferenceMainText": { "x": 423, "y": 390, "fontSize": 10, "fontWeight": "normal", "color": "#000000", "letterSpacing": 0, "fontFamily": "Montserrat", "zIndex": 1, "width": 300, "height": 40 },
    "signatureNameText": { "x": 331, "y": 421, "fontSize": 12, "fontWeight": "bold", "color": "#000000", "letterSpacing": 0, "fontFamily": "Montserrat", "zIndex": 1, "width": 200, "height": 20 },
    "signatureTitleText": { "x": 313, "y": 451, "fontSize": 10, "fontWeight": "normal", "color": "#000000", "letterSpacing": 0, "fontFamily": "Montserrat", "zIndex": 1, "width": 200, "height": 20 },
    "footerLogo": { "x": 701, "y": 450, "width": 60, "height": 60, "zIndex": 10, "fontFamily": "Montserrat" },
    "footerBanner": { "x": -2, "y": 526, "width": 800, "height": 40, "backgroundColor": "#000000", "borderRadius": 0, "zIndex": 5, "fontFamily": "Montserrat" },
    "footerLicenseNoLabelText": { "x": 509, "y": 536, "fontSize": 10, "fontWeight": "normal", "color": "#FFFFFF", "letterSpacing": 0.5, "fontFamily": "Montserrat", "zIndex": 6, "width": 200, "height": 20 },
    "footerLicenseNoValueText": { "x": 350, "y": 330, "fontSize": 10, "fontWeight": "normal", "color": "#FFFFFF", "letterSpacing": 0.5, "fontFamily": "LedSledStraight", "zIndex": 6, "width": 150, "height": 20 }
  };
  const [elementStyles, setElementStyles] = useState<AllElementStyles>(initialElementStyles);

  const [previewSizePreset, setPreviewSizePreset] = useState<string>('ORIGINAL_DESIGN');
  const [previewWidth, setPreviewWidth] = useState<number>(PREVIEW_SIZES.ORIGINAL_DESIGN.width);
  const [previewHeight, setPreviewHeight] = useState<number>(PREVIEW_SIZES.ORIGINAL_DESIGN.height);
  const [panelPosition, setPanelPosition] = useState({ x: window.innerWidth - 420, y: 60 });
  const [selectedElementKeysForPanel, setSelectedElementKeysForPanel] = useState<string[]>([]);

  const configCardRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const licensePreviewRef = useRef<HTMLDivElement>(null);

  // Refs for multi-drag state
  const dragStartPositionsSnapshotRef = useRef<{ [key: string]: { x: number, y: number } } | null>(null);
  const activeDraggedElementKeyRef = useRef<string | null>(null);

  const handleFormInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, name } = e.target;
    if (name === "licenseType") {
      setSelectedLicenseType(value);
      return;
    }
    const mapIdToKey: { [key: string]: keyof FormData } = {
        formIssuedDate: 'issuedDate',
        formExpiryDate: 'expiryDate',
        formLicenseNumber: 'licenseNumber',
        formLicenseeName: 'licenseeName',
        formRegulatedActivity: 'regulatedActivity',
        formLegalReference: 'legalReference',
        formSignatoryName: 'signatoryName',
        formSignatoryTitle: 'signatoryTitle',
    };
    const key = mapIdToKey[id];
    if (key) {
        setFormData(prev => ({ ...prev, [key]: value }));
    }
  };

  const handlePreviewTextUpdate = (fieldName: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleElementStyleChange = (elementKey: string, newPartialStyles: Partial<ElementStyleProperties>) => {
    setElementStyles(prev => {
      const existingStyles = prev[elementKey] || { x: 0, y: 0 }; // Ensure defaults if somehow missing
      let updatedStyles = { ...existingStyles, ...newPartialStyles };

      if (elementKey.startsWith('dot')) {
        let diameterChanged = false;
        let newDiameter = updatedStyles.width; // Default to width if available

        if (newPartialStyles.width !== undefined) {
          newDiameter = newPartialStyles.width;
          diameterChanged = true;
        } else if (newPartialStyles.height !== undefined) {
          newDiameter = newPartialStyles.height;
          diameterChanged = true;
        } else if (newPartialStyles.borderRadius !== undefined) {
          newDiameter = newPartialStyles.borderRadius * 2;
          diameterChanged = true;
        }

        if (diameterChanged && newDiameter !== undefined) {
          updatedStyles.width = newDiameter;
          updatedStyles.height = newDiameter;
          updatedStyles.borderRadius = newDiameter / 2;
        }
      }

      return {
        ...prev,
        [elementKey]: updatedStyles as ElementStyleProperties,
      };
    });
  };

  const handlePreviewSizeChange = (newPreset: string, customWidth?: number, customHeight?: number) => {
    setPreviewSizePreset(newPreset);
    if (newPreset === 'CUSTOM') {
      // For custom, only update if values are provided, otherwise keep current custom values or default to original if no custom yet
      if (customWidth !== undefined) setPreviewWidth(customWidth);
      else if (previewSizePreset !== 'CUSTOM') setPreviewWidth(PREVIEW_SIZES.ORIGINAL_DESIGN.width); // reset if switching to custom
      
      if (customHeight !== undefined) setPreviewHeight(customHeight);
      else if (previewSizePreset !== 'CUSTOM') setPreviewHeight(PREVIEW_SIZES.ORIGINAL_DESIGN.height); // reset if switching to custom

    } else {
      const selected = PREVIEW_SIZES[newPreset as keyof typeof PREVIEW_SIZES];
      if (selected) {
        setPreviewWidth(selected.width);
        setPreviewHeight(selected.height);
      }
    }
  };

  const handleElementSelectInPreview = (elementKey: string | null, isCtrlOrMetaPressed: boolean) => {
    if (elementKey === null) { // Clicked on backdrop
      setSelectedElementKeysForPanel([]);
      return;
    }

    setSelectedElementKeysForPanel(prevSelectedKeys => {
      if (isCtrlOrMetaPressed) {
        if (prevSelectedKeys.includes(elementKey)) {
          return prevSelectedKeys.filter(k => k !== elementKey); // Deselect if already selected
        } else {
          return [...prevSelectedKeys, elementKey]; // Add to selection
        }
      } else {
        // If not Ctrl/Meta pressed, select only the clicked element
        // (unless it's already the only selected element, then deselect others - or keep as is for now)
        if (prevSelectedKeys.includes(elementKey) && prevSelectedKeys.length === 1) {
            return []; // Deselect if clicking the only selected item again without Ctrl
        } 
        return [elementKey]; // Select only this one
      }
    });
  };

  // Function to handle bulk style updates
  const handleBulkStyleChange = (updates: { [key: string]: Partial<ElementStyleProperties> }) => {
    setElementStyles(prev => {
      const newState = { ...prev };
      for (const key in updates) {
        if (newState[key]) { // Ensure the element exists
          newState[key] = { ...newState[key], ...updates[key] };
        }
      }
      return newState;
    });
  };

  // Function to handle alignment actions
  const handleAlignment = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedElementKeysForPanel.length < 2) return;

    const selectedStyles = selectedElementKeysForPanel.map(key => ({ key, style: elementStyles[key] })).filter(item => item.style); // Get styles of selected elements
    if (selectedStyles.length < 2) return;

    const target = selectedStyles[0]; // Use the first selected element as the reference
    const updates: { [key: string]: Partial<ElementStyleProperties> } = {};

    selectedStyles.slice(1).forEach(({ key, style }) => {
      let newX = style.x;
      let newY = style.y;
      const targetWidth = target.style.width ?? 0;
      const targetHeight = target.style.height ?? 0;
      const styleWidth = style.width ?? 0;
      const styleHeight = style.height ?? 0;

      switch (type) {
        case 'left':    newX = target.style.x; break;
        case 'center':  newX = target.style.x + targetWidth / 2 - styleWidth / 2; break;
        case 'right':   newX = target.style.x + targetWidth - styleWidth; break;
        case 'top':     newY = target.style.y; break;
        case 'middle':  newY = target.style.y + targetHeight / 2 - styleHeight / 2; break;
        case 'bottom':  newY = target.style.y + targetHeight - styleHeight; break;
      }
      updates[key] = { x: Math.round(newX), y: Math.round(newY) }; // Round to nearest pixel
    });

    handleBulkStyleChange(updates);
  };

  // Function to handle distribution actions
  const handleDistribution = (direction: 'horizontal' | 'vertical') => {
     if (selectedElementKeysForPanel.length < 3) return;

    const selectedStyles = selectedElementKeysForPanel
        .map(key => ({ key, style: elementStyles[key] }))
        .filter(item => item.style);
    if (selectedStyles.length < 3) return;

    const sorted = [...selectedStyles].sort((a, b) => {
      return direction === 'horizontal'
        ? a.style.x - b.style.x
        : a.style.y - b.style.y;
    });

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    let startPos: number;
    let endPos: number;
    let totalSize: number;

    if (direction === 'horizontal') {
        startPos = first.style.x;
        endPos = last.style.x + (last.style.width ?? 0);
        totalSize = sorted.reduce((acc, el) => acc + (el.style.width ?? 0), 0);
    } else { // vertical
        startPos = first.style.y;
        endPos = last.style.y + (last.style.height ?? 0);
        totalSize = sorted.reduce((acc, el) => acc + (el.style.height ?? 0), 0);
    }

    const totalSpace = endPos - startPos;
    const gap = (totalSpace - totalSize) / (sorted.length - 1);
    if (gap < 0) {
        console.warn("Cannot distribute elements, overlap detected or total size exceeds space.");
        return; // Avoid negative gaps or overlaps
    }

    const updates: { [key: string]: Partial<ElementStyleProperties> } = {};
    let currentPos = startPos;

    sorted.forEach((item, i) => {
      if (i > 0) { // Don't reposition the first element
        const prevItem = sorted[i - 1];
        if (direction === 'horizontal') {
            currentPos += (prevItem.style.width ?? 0) + gap;
            updates[item.key] = { x: Math.round(currentPos) };
        } else { // vertical
            currentPos += (prevItem.style.height ?? 0) + gap;
            updates[item.key] = { y: Math.round(currentPos) };
        }
      }
    });
    
    handleBulkStyleChange(updates);
  };

  // --- Download Handlers ---
  const captureLicensePreview = async (): Promise<HTMLCanvasElement | null> => {
    if (!licensePreviewRef.current) {
      console.error("License preview element not found.");
      alert("Could not find license preview element.");
      return null;
    }
    try {
      const canvas = await html2canvas(licensePreviewRef.current, {
        scale: 6,
        useCORS: true,
        logging: false,
      });
      return canvas;
    } catch (error) {
      console.error("Error capturing license preview:", error);
      alert("Error capturing license preview. See console.");
      return null;
    }
  };

  const handleDownloadPdf = async () => {
    const canvas = await captureLicensePreview();
    if (!canvas) return;

    try {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const width = imgWidth * ratio;
      const height = imgHeight * ratio;
      
      const x = (pdfWidth - width) / 2;
      const y = (pdfHeight - height) / 2;

      pdf.addImage(imgData, 'PNG', x, y, width, height);
      pdf.save('capital_market_license.pdf');
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Error generating PDF. See console.");
    }
  };

  const handleDownloadJpeg = async () => {
    const canvas = await captureLicensePreview();
    if (!canvas) return;

    try {
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = 'capital_market_license.jpeg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating JPEG:", error);
      alert("Error generating JPEG. See console.");
    }
  };
  // --- End Download Handlers ---

  // Effect for AI-powered form pre-filling - KEPT AND ADAPTED
  useEffect(() => {
    if (activeMainView === 'create' && apiKey && selectedLicenseType && aiProvider === 'Groq') {
      console.log(`AI Call Triggered: License Type - ${selectedLicenseType}, Provider - ${aiProvider}, Model - ${aiModel}`);
      
      const relevantDocumentContent = "Simulated content from knowledge base documents related to " + selectedLicenseType;

      const callGroqApi = async () => {
        try {
          const groq = new Groq({ apiKey: apiKey, dangerouslyAllowBrowser: true });
          const chatCompletion = await groq.chat.completions.create({
            messages: [
              {
                role: "system",
                content: "You are an assistant that helps pre-fill form data for Capital Market Licenses based on a selected license type and relevant sections of acts from a knowledge base. Provide the data as a JSON object with keys matching the FormData interface: issuedDate, expiryDate, licenseNumber, licenseeName, regulatedActivity, legalReference, signatoryName, signatoryTitle."
              },
              {
                role: "user",
                content: `The selected license type is "${selectedLicenseType}". Based on the following information from our knowledge base: "${relevantDocumentContent}", please provide the typical values for the license form. For fields like 'licenseeName', 'licenseNumber', 'issuedDate', 'expiryDate', if these are typically unique per license, you can use placeholder text like 'Enter Licensee Name', 'CMLXXXXXX', 'DD/MM/YYYY' etc. For 'regulatedActivity' and 'legalReference', provide specific text based on the license type and knowledge base. For 'signatoryName' and 'signatoryTitle', provide common defaults if available, otherwise placeholders. Respond with ONLY the JSON object.`
              }
            ],
            model: aiModel,
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
          });

          const responseContent = chatCompletion.choices[0]?.message?.content;
          if (responseContent) {
            console.log("Groq API Response:", responseContent);
            try {
              let cleanedResponseContent = responseContent.trim();
              if (cleanedResponseContent.startsWith("```json")) {
                cleanedResponseContent = cleanedResponseContent.substring(7);
              } else if (cleanedResponseContent.startsWith("```")) {
                cleanedResponseContent = cleanedResponseContent.substring(3);
              }
              if (cleanedResponseContent.endsWith("```")) {
                cleanedResponseContent = cleanedResponseContent.slice(0, -3);
              }
              cleanedResponseContent = cleanedResponseContent.trim();

              const parsedData = JSON.parse(cleanedResponseContent);
              setFormData(prevData => ({
                ...prevData,
                ...(parsedData.regulatedActivity && { regulatedActivity: parsedData.regulatedActivity }),
                ...(parsedData.legalReference && { legalReference: parsedData.legalReference }),
                issuedDate: parsedData.issuedDate || prevData.issuedDate,
                expiryDate: parsedData.expiryDate || prevData.expiryDate,
                licenseNumber: parsedData.licenseNumber || prevData.licenseNumber,
                licenseeName: parsedData.licenseeName || prevData.licenseeName,
                signatoryName: parsedData.signatoryName || prevData.signatoryName,
                signatoryTitle: parsedData.signatoryTitle || prevData.signatoryTitle,
              }));
              console.log("Form data updated with AI response.");
            } catch (error) {
              console.error("Error parsing AI response JSON:", error);
            }
          } else {
            console.log("No content in AI response.");
          }
        } catch (error) {
          console.error('Error calling Groq API for pre-fill:', error);
        }
      };
      callGroqApi();
    }
  }, [selectedLicenseType, apiKey, aiProvider, aiModel, activeMainView]);

  useEffect(() => {
    // Scroll to the first selected element if the panel is open and there's at least one selection
    if (selectedElementKeysForPanel.length > 0 && isConfigPanelOpen) {
      const firstSelectedKey = selectedElementKeysForPanel[0];
      if (configCardRefs.current[firstSelectedKey]) {
        configCardRefs.current[firstSelectedKey]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest' 
        });
      }
    }
  }, [selectedElementKeysForPanel, isConfigPanelOpen]);

  const handlePrint = () => {
    window.print();
  };
  
  const pageStyles = `
    @font-face {
      font-family: 'Montserrat';
      src: url('/fonts/Montserrat-Regular.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
      font-family: 'Montserrat';
      src: url('/fonts/Montserrat-Bold.ttf') format('truetype');
      font-weight: bold;
      font-style: normal;
    }
    @font-face {
      font-family: 'LedSledStraight';
      src: url('/fonts/LEDSledStraight.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }

    body {
        font-family: 'Arial', 'Inter', sans-serif;
        background-color: #f3f4f6;
    }

    @media print {
        body * {
            visibility: hidden;
        }
        #htmlLicensePreviewPrintContainer, #htmlLicensePreviewPrintContainer * {
            visibility: visible;
        }
        #htmlLicensePreviewPrintContainer {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
            background-color: white !important;
        }
        .no-print {
            display: none !important;
        }
    }

    .placeholder-logo {
        width: 100px;
        height: auto;
        fill: #cccccc;
    }
    .placeholder-qr {
        width: 100px;
        height: 100px;
        fill: #cccccc;
    }
    .font-arial { 
        font-family: 'Arial', sans-serif;
    }
    .font-montserrat { 
        font-family: 'Montserrat', sans-serif;
    }
    .font-ledsled {
        font-family: 'LedSledStraight', 'Courier New', monospace;
    }
    .text-xxs {
        font-size: 0.65rem;
    }
    .config-card-highlight {
        border: 2px solid #4F46E5 !important; /* Indigo-600 border */
        box-shadow: 0 0 10px rgba(79, 70, 229, 0.5);
    }
  `;

  const handleElementDragStart = (draggedElementKey: string) => {
    if (selectedElementKeysForPanel.includes(draggedElementKey) && selectedElementKeysForPanel.length > 1) {
      activeDraggedElementKeyRef.current = draggedElementKey;
      const snapshot: { [key: string]: { x: number, y: number } } = {};
      selectedElementKeysForPanel.forEach(key => {
        if (elementStyles[key]) {
          snapshot[key] = { x: elementStyles[key].x, y: elementStyles[key].y };
        }
      });
      dragStartPositionsSnapshotRef.current = snapshot;
      console.log('Multi-drag started. Snapshot:', snapshot, 'Active Key:', draggedElementKey);
    } else {
      activeDraggedElementKeyRef.current = null;
      dragStartPositionsSnapshotRef.current = null;
      console.log('Single drag started or dragged element not in multi-selection.');
    }
  };

  const handleElementDragStop = (draggedElementKey: string, data: { x: number, y: number }) => {
    const { x: finalX, y: finalY } = data;
    console.log(`Drag stop for ${draggedElementKey}. Final X: ${finalX}, Final Y: ${finalY}. Active: ${activeDraggedElementKeyRef.current}`);

    if (
      activeDraggedElementKeyRef.current === draggedElementKey &&
      dragStartPositionsSnapshotRef.current &&
      selectedElementKeysForPanel.includes(draggedElementKey) && // Ensure the dragged key is still selected
      selectedElementKeysForPanel.length > 1
    ) {
      console.log('Processing multi-drag stop.');
      const initialPositions = dragStartPositionsSnapshotRef.current;
      const primaryElementInitialPos = initialPositions[draggedElementKey];

      if (!primaryElementInitialPos) {
        console.error('Primary element initial position not found in snapshot.');
        // Fallback to single element update to prevent loss of movement for the dragged item
        handleElementStyleChange(draggedElementKey, { x: finalX, y: finalY });
        activeDraggedElementKeyRef.current = null;
        dragStartPositionsSnapshotRef.current = null;
        return;
      }

      const deltaX = finalX - primaryElementInitialPos.x;
      const deltaY = finalY - primaryElementInitialPos.y;
      console.log(`Delta X: ${deltaX}, Delta Y: ${deltaY}`);

      const updates: { [key: string]: Partial<ElementStyleProperties> } = {};
      selectedElementKeysForPanel.forEach(key => {
        const selectedElementInitialPos = initialPositions[key];
        if (selectedElementInitialPos) {
          updates[key] = { 
            ...elementStyles[key], // Preserve other styles
            x: Math.round(selectedElementInitialPos.x + deltaX), 
            y: Math.round(selectedElementInitialPos.y + deltaY) 
          };
        }
      });
      console.log('Bulk updates for multi-drag:', updates);
      handleBulkStyleChange(updates);
    } else {
      console.log('Processing single drag stop.');
      handleElementStyleChange(draggedElementKey, { x: finalX, y: finalY });
    }

    // Reset refs after operation
    activeDraggedElementKeyRef.current = null;
    dragStartPositionsSnapshotRef.current = null;
    console.log('Drag refs reset.');
  };

  return (
    <>
      <style>{pageStyles}</style>
      <header className="bg-white shadow-md no-print w-full sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img src="/images/SCPNG Original Logo.png" alt="SCPNG Logo" className="h-10 w-auto mr-2" />
              <span className="font-bold text-xl text-gray-800">Capital Market License Registry</span>
            </div>
            <nav className="flex space-x-4">
              {[{id: 'dashboard', label: 'Dashboard'}, {id: 'create', label: 'Create'}, {id: 'settings', label: 'Settings'}, {id: 'admin', label: 'Admin'}].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveMainView(item.id as MainView)}
                  className={`px-3 py-2 rounded-md text-sm font-medium
                    ${activeMainView === item.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                    }`
                  }
                >
                  {item.label}
                </button>
              ))}
               <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Conditional layout: Flex for 'create' view with panel, standard for others */} 
      {activeMainView === 'create' ? (
        <div className="flex flex-1 w-full"> {/* Flex container for create view + panel */}
          <div className={`min-h-screen flex flex-col items-center justify-start py-8 px-4 w-full transition-all duration-300 ease-in-out`}>
            {/* Create View Content */}
            <div className={`w-full max-w-5xl bg-white p-6 md:p-8 rounded-lg shadow-xl no-print`}>
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 font-arial flex-grow">Capital Market License Generator</h1>
              </div>
              {/* Form grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                <div>
                  <label htmlFor="licenseType" className="block text-sm font-medium text-gray-700 mb-1">License Type:</label>
                  <select 
                    id="licenseType" 
                    name="licenseType"
                    value={selectedLicenseType} 
                    onChange={handleFormInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {licenseTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="formIssuedDate" className="block text-sm font-medium text-gray-700 mb-1">Issued Date:</label>
                  <input type="text" id="formIssuedDate" value={formData.issuedDate} onChange={handleFormInputChange} placeholder="DD/MM/YYYY" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label htmlFor="formExpiryDate" className="block text-sm font-medium text-gray-700 mb-1">Expiry Date:</label>
                  <input type="text" id="formExpiryDate" value={formData.expiryDate} onChange={handleFormInputChange} placeholder="DD/MM/YYYY" className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label htmlFor="formLicenseNumber" className="block text-sm font-medium text-gray-700 mb-1">License Number (CML...):</label>
                  <input type="text" id="formLicenseNumber" value={formData.licenseNumber} onChange={handleFormInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label htmlFor="formLicenseeName" className="block text-sm font-medium text-gray-700 mb-1">Licensee Name (Granted to):</label>
                  <input type="text" id="formLicenseeName" value={formData.licenseeName} onChange={handleFormInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="formRegulatedActivity" className="block text-sm font-medium text-gray-700 mb-1">Regulated Activity:</label>
                  <input type="text" id="formRegulatedActivity" value={formData.regulatedActivity} onChange={handleFormInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div className="md:col-span-3">
                  <label htmlFor="formLegalReference" className="block text-sm font-medium text-gray-700 mb-1">Legal Reference:</label>
                  <input type="text" id="formLegalReference" value={formData.legalReference} onChange={handleFormInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label htmlFor="formSignatoryName" className="block text-sm font-medium text-gray-700 mb-1">Authorised Signatory Name:</label>
                  <input type="text" id="formSignatoryName" value={formData.signatoryName} onChange={handleFormInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label htmlFor="formSignatoryTitle" className="block text-sm font-medium text-gray-700 mb-1">Authorised Signatory Title:</label>
                  <input type="text" id="formSignatoryTitle" value={formData.signatoryTitle} onChange={handleFormInputChange} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex space-x-4 mt-6">
                 <button id="printButton" onClick={handlePrint} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-arial">
                  Print License
                </button>
                <button id="downloadPdfButton" onClick={handleDownloadPdf} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-arial">
                  Download PDF
                </button>
                 <button id="downloadJpegButton" onClick={handleDownloadJpeg} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 font-arial">
                  Download JPEG
                </button>
              </div>
            </div>
            <div id="htmlLicensePreviewPrintContainer" className={`w-full max-w-5xl mt-8 no-print flex justify-center`}>
              <HtmlLicensePreview 
                ref={licensePreviewRef} 
                formData={formData} 
                onTextChange={handlePreviewTextUpdate} 
                elementStyles={elementStyles}
                onElementStyleChange={handleElementStyleChange}
                previewWidth={previewWidth}
                previewHeight={previewHeight}
                onElementSelect={handleElementSelectInPreview}
                selectedElementKeys={selectedElementKeysForPanel}
                onElementDragStart={handleElementDragStart}
                onElementDragStop={handleElementDragStop}
              />
            </div>
          </div>

          {/* Draggable Configuration Panel (only for create view) */ 
          {isConfigPanelOpen ? (
            <Draggable 
              handle=".config-panel-
              position={panelPosition}
              onStop={(e, data) => setPanelPosition({ x: data.x, y: data.y })}
              bounds="parent" // Or specify bounds like 'body' or an element ID if needed
            >
              <div 
                style={{
                  position: 'fixed', // Fixed position relative to viewport
                  width: '380px',
                  zIndex: 1000,
                  // top:0, left:0 are implicitly handled by Draggable transform
                }}
                className="bg-gray-50 shadow-2xl rounded-lg no-print border border-gray-300 flex flex-col overflow-hidden"
              >
                <div className="config-panel-drag-handle cursor-move p-3 bg-gray-200 border-b border-gray-300 rounded-t-lg">
                  <h2 className="text-lg font-semibold text-gray-700">Configuration Panel</h2>
                </div>
                <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 60px)' /* Adjusted for handle */ }}>
                  {/* Copy Settings Button */}
                  <div className="mb-4">
                    <button 
                      onClick={async () => {
                        try {
                          const settingsToCopy = {
                            formData: formData,
                            elementStyles: elementStyles,
                            // You could also include previewWidth, previewHeight if needed
                            // previewWidth: previewWidth,
                            // previewHeight: previewHeight,
                          };
                          const jsonSettings = JSON.stringify(settingsToCopy, null, 2);
                          await navigator.clipboard.writeText(jsonSettings);
                          alert('Settings copied to clipboard as JSON!');
                        } catch (err) {
                          console.error('Failed to copy settings: ', err);
                          alert('Failed to copy settings. See console for details.');
                        }
                      }}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm"
                    >
                      Copy All Settings to JSON
                    </button>
                  </div>

                  {/* Backdrop Size Configuration */}
                  <div className="mb-4 p-3 border rounded-md bg-white">
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Backdrop Size</h3>
                    <div className="space-y-2">
                      <div>
                        <label htmlFor="previewSizePreset" className="block text-xs font-medium text-gray-600">Preset:</label>
                        <select
                          id="previewSizePreset"
                          value={previewSizePreset}
                          onChange={(e) => handlePreviewSizeChange(e.target.value)}
                          className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs"
                        >
                          {Object.entries(PREVIEW_SIZES).map(([key, value]) => (
                            <option key={key} value={key}>{value.name}</option>
                          ))}
                        </select>
                      </div>
                      {previewSizePreset === 'CUSTOM' && (
                        <>
                          <div>
                            <label htmlFor="customPreviewWidth" className="block text-xs font-medium text-gray-600">Width (px):</label>
                            <input
                              type="number"
                              id="customPreviewWidth"
                              value={previewWidth}
                              onChange={(e) => handlePreviewSizeChange('CUSTOM', parseInt(e.target.value) || PREVIEW_SIZES.ORIGINAL_DESIGN.width, undefined)}
                              className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs"
                            />
                          </div>
                          <div>
                            <label htmlFor="customPreviewHeight" className="block text-xs font-medium text-gray-600">Height (px):</label>
                            <input
                              type="number"
                              id="customPreviewHeight"
                              value={previewHeight}
                              onChange={(e) => handlePreviewSizeChange('CUSTOM', undefined, parseInt(e.target.value) || PREVIEW_SIZES.ORIGINAL_DESIGN.height)}
                              className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Alignment Controls - Visible only when multiple elements selected */}
                  {selectedElementKeysForPanel.length > 1 && (
                    <div className="mb-4 p-3 border rounded-md bg-white">
                      <h3 className="text-md font-semibold text-gray-700 mb-3">Align Selected ({selectedElementKeysForPanel.length})</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {/* Row 1: Left, Center H, Right */}
                        <button onClick={() => handleAlignment('left')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded">Align Left</button>
                        <button onClick={() => handleAlignment('center')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded">Center H</button>
                        <button onClick={() => handleAlignment('right')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded">Align Right</button>
                        {/* Row 2: Top, Middle V, Bottom */}
                        <button onClick={() => handleAlignment('top')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded">Align Top</button>
                        <button onClick={() => handleAlignment('middle')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded">Middle V</button>
                        <button onClick={() => handleAlignment('bottom')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded">Align Bottom</button>
                      </div>
                      {selectedElementKeysForPanel.length > 2 && ( // Distribute needs 3+
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200">
                           <button onClick={() => handleDistribution('horizontal')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded">Distribute H</button>
                           <button onClick={() => handleDistribution('vertical')} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-1 px-2 rounded">Distribute V</button>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <h3 className="text-md font-semibold text-gray-700 mb-2">Element Styles</h3>
                    {Object.entries(elementStyles).map(([key, styles]) => (
                      <div 
                        key={key} 
                        ref={el => configCardRefs.current[key] = el}
                        className={`mb-3 p-3 border rounded-md bg-white space-y-2 ${selectedElementKeysForPanel.includes(key) ? 'config-card-highlight' : 'border-gray-300'}`}>
                        <p className="text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z](?=[a-z]))|([A-Z]+(?![a-z]))/g, ' $1$2').trim()}</p>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                          {/* Position Inputs - always show */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600">X Pos:</label>
                            <input type="number" value={styles.x} onChange={(e) => handleElementStyleChange(key, { x: parseInt(e.target.value) || 0 })} className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600">Y Pos:</label>
                            <input type="number" value={styles.y} onChange={(e) => handleElementStyleChange(key, { y: parseInt(e.target.value) || 0 })} className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs" />
                          </div>

                          {/* Conditional Style Inputs */ 
                          {styles.hasOwnProperty('width') && (
                            <div><label className="block text-xs font-medium text-gray-600">Width (px):</label><input type="number" value={styles.width ?? ''} onChange={(e) => handleElementStyleChange(key, { width: parseInt(e.target.value) || undefined })} className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs" /></div>
                          )}
                          {styles.hasOwnProperty('height') && (
                            <div><label className="block text-xs font-medium text-gray-600">Height (px):</label><input type="number" value={styles.height ?? ''} onChange={(e) => handleElementStyleChange(key, { height: parseInt(e.target.value) || undefined })} className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs" /></div>
                          )}
                          {styles.hasOwnProperty('fontSize') && (
                            <div><label className="block text-xs font-medium text-gray-600">Font Size (px):</label><input type="number" value={styles.fontSize ?? ''} onChange={(e) => handleElementStyleChange(key, { fontSize: parseInt(e.target.value) || undefined })} className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs" /></div>
                          )}
                          {styles.hasOwnProperty('color') && (
                            <div><label className="block text-xs font-medium text-gray-600">Color:</label><input type="color" value={styles.color || '#000000'} onChange={(e) => handleElementStyleChange(key, { color: e.target.value })} className="mt-1 w-full p-1 h-8 border border-gray-300 rounded-md" /></div>
                          )}
                          {styles.hasOwnProperty('backgroundColor') && (
                            <div><label className="block text-xs font-medium text-gray-600">Bg Color:</label><input type="color" value={styles.backgroundColor || '#000000'} onChange={(e) => handleElementStyleChange(key, { backgroundColor: e.target.value })} className="mt-1 w-full p-1 h-8 border border-gray-300 rounded-md" /></div>
                          )}
                          {styles.hasOwnProperty('fontWeight') && (
                            <div>
                              <label className="block text-xs font-medium text-gray-600">Font Weight:</label>
                              <select value={styles.fontWeight || 'normal'} onChange={(e) => handleElementStyleChange(key, { fontWeight: e.target.value })} className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs">
                                <option value="normal">Normal</option><option value="bold">Bold</option><option value="lighter">Lighter</option><option value="bolder">Bolder</option>
                                <option value="100">100</option><option value="200">200</option><option value="300">300</option><option value="400">400 (Normal)</option>
                                <option value="500">500</option><option value="600">600</option><option value="700">700 (Bold)</option><option value="800">800</option><option value="900">900</option>
                              </select>
                            </div>
                          )}
                          {styles.hasOwnProperty('letterSpacing') && (
                            <div><label className="block text-xs font-medium text-gray-600">Letter Spacing (px):</label><input type="number" step="0.1" value={styles.letterSpacing ?? ''} onChange={(e) => handleElementStyleChange(key, { letterSpacing: parseFloat(e.target.value) || undefined })} className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs" /></div>
                          )}
                          {styles.hasOwnProperty('fontFamily') && (
                            <div>
                              <label className="block text-xs font-medium text-gray-600">Font Family:</label>
                              <select 
                                value={styles.fontFamily || 'Arial'}
                                onChange={(e) => handleElementStyleChange(key, { fontFamily: e.target.value })} 
                                className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs"
                              >
                                {availableFontFamilies.map(font => <option key={font} value={font}>{font}</option>)}
                              </select>
                            </div>
                          )}
                          {styles.hasOwnProperty('borderRadius') && key !== 'mainTitleBanner' && (
                            <div><label className="block text-xs font-medium text-gray-600">Border Radius (px):</label><input type="number" value={styles.borderRadius ?? ''} onChange={(e) => handleElementStyleChange(key, { borderRadius: parseInt(e.target.value) || undefined })} className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs" /></div>
                          )}
                          {key === 'mainTitleBanner' && (
                            <>
                              <div><label className="block text-xs font-medium text-gray-600">Top-Left Radius (px):</label><input type="number" value={styles.borderTopLeftRadius ?? ''} onChange={(e) => handleElementStyleChange(key, { borderTopLeftRadius: parseInt(e.target.value) || 0 })} className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs" /></div>
                              <div><label className="block text-xs font-medium text-gray-600">Top-Right Radius (px):</label><input type="number" value={styles.borderTopRightRadius ?? ''} onChange={(e) => handleElementStyleChange(key, { borderTopRightRadius: parseInt(e.target.value) || 0 })} className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs" /></div>
                              <div><label className="block text-xs font-medium text-gray-600">Bottom-Left Radius (px):</label><input type="number" value={styles.borderBottomLeftRadius ?? ''} onChange={(e) => handleElementStyleChange(key, { borderBottomLeftRadius: parseInt(e.target.value) || 0 })} className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs" /></div>
                              <div><label className="block text-xs font-medium text-gray-600">Bottom-Right Radius (px):</label><input type="number" value={styles.borderBottomRightRadius ?? ''} onChange={(e) => handleElementStyleChange(key, { borderBottomRightRadius: parseInt(e.target.value) || 0 })} className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs" /></div>
                            </>
                          )}
                          {styles.hasOwnProperty('zIndex') && (
                            <div><label className="block text-xs font-medium text-gray-600">Z-Index:</label><input type="number" value={styles.zIndex ?? ''} onChange={(e) => handleElementStyleChange(key, { zIndex: parseInt(e.target.value) || undefined })} className="mt-1 w-full p-1 border border-gray-300 rounded-md text-xs" /></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Draggable>
          )}
        </div>
      ) : (
        // Standard layout for other views (settings, dashboard, admin)
        <div className="min-h-screen flex flex-col items-center justify-start py-8 px-4 w-full">
        {activeMainView === 'settings' && (
           <div className="w-full max-w-5xl mt-0">
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl mb-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-4 font-arial">Knowledge Base</h3>
               <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-900">Upload Knowledge Base Documents</p>
                <p className="mt-1 text-xs text-gray-500">Drop your documents here or click to browse</p>
                <button type="button" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Browse Files
                </button>
                <p className="mt-2 text-xs text-gray-500">Supported formats: PDF, Word, Text (max 10MB)</p>
              </div>

              <h4 className="text-lg font-semibold text-gray-700 mb-3 font-arial">Uploaded Documents</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center">
                    <svg className="w-6 h-6 text-indigo-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-8V6h2v4h1.5l-2.5 3-2.5-3H9zM7 11.5A1.5 1.5 0 015.5 10h-1A2.5 2.5 0 007 12.5V14H5v-1.5A1.5 1.5 0 016.5 11H7v.5zm6 0V10h1.5a1.5 1.5 0 010 3H13v-1.5a1.5 1.5 0 01-1.5-1.5h1.5z"/>
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Capital Market Act 2015.pdf</p>
                      <p className="text-xs text-gray-500">1.19 MB • 5/8/2025</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full mr-3">Active</span>
                    <button type="button" className="text-gray-400 hover:text-red-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl">
              <h3 className="text-xl font-semibold text-gray-700 mb-1 font-arial">AI Configuration</h3>
              <p className="text-sm text-gray-500 mb-6">Configure AI parameters for license generation</p>
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <a href="#"
                      onClick={() => setActiveAiConfigTab('general')}
                      className={`${activeAiConfigTab === 'general' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                      aria-current={activeAiConfigTab === 'general' ? 'page' : undefined}
                    >
                      General
                    </a>
                    <a href="#"
                      onClick={() => setActiveAiConfigTab('knowledgeBase')}
                      className={`${activeAiConfigTab === 'knowledgeBase' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                      aria-current={activeAiConfigTab === 'knowledgeBase' ? 'page' : undefined}
                    >
                      Knowledge Base
                    </a>
                    <a href="#"
                      onClick={() => setActiveAiConfigTab('advanced')}
                      className={`${activeAiConfigTab === 'advanced' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                      aria-current={activeAiConfigTab === 'advanced' ? 'page' : undefined}
                    >
                      Advanced
                    </a>
                  </nav>
                </div>
              </div>
              {activeAiConfigTab === 'general' && (
                <div>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-6">
                      <label htmlFor="ai-provider" className="block text-sm font-medium text-gray-700">AI Provider</label>
                      <select id="ai-provider" name="ai-provider" value={aiProvider} onChange={(e) => setAiProvider(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option>Groq</option>
                        <option>OpenAI</option>
                        <option>Anthropic</option>
                      </select>
                    </div>
                    <div className="sm:col-span-6">
                      <label htmlFor="ai-model" className="block text-sm font-medium text-gray-700">Model</label>
                      <select id="ai-model" name="ai-model" value={aiModel} onChange={(e) => setAiModel(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option>meta-llama/llama-4-scout-17b-16e-instruct</option>
                        <option>deepseek-r1-distill-llama-70b</option>
                        <option>gpt-4</option>
                        <option>claude-2</option>
                      </select>
                    </div>
                    <div className="sm:col-span-6">
                      <label htmlFor="api-key" className="block text-sm font-medium text-gray-700">API Key</label>
                      <input type="password" name="api-key" id="api-key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your API key" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end space-x-3">
                    <button 
                      type="button" 
                      onClick={async () => {
                        if (!apiKey) {
                          alert("Please enter an API Key.");
                          return;
                        }
                        if (aiProvider === 'Groq') {
                          try {
                            const groq = new Groq({ apiKey: apiKey, dangerouslyAllowBrowser: true });
                            console.log(`Testing Groq connection with model: ${aiModel}`);
                            const chatCompletion = await groq.chat.completions.create({
                              messages: [{ role: "user", content: "Hello!" }],
                              model: aiModel,
                              temperature: 0.7,
                              max_tokens: 10,
                            });
                            const response = chatCompletion.choices[0]?.message?.content;
                            console.log("Groq test response:", response);
                            alert("Groq connection successful! Check console for response.");
                          } catch (error) {
                            console.error("Groq connection test failed:", error);
                            alert(`Groq connection test failed: ${error instanceof Error ? error.message : String(error)}`);
                          }
                        } else {
                          alert(`${aiProvider} connection test not implemented yet.`);
                        }
                      }} 
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Test Connection
                    </button>
                    <button type="submit" onClick={() => console.log('Save Configuration clicked', { aiProvider, aiModel, apiKey })} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Save Configuration
                    </button>
                  </div>
                </div>
              )}
              {activeAiConfigTab === 'knowledgeBase' && (
                <div className="p-4 border border-dashed border-gray-300 rounded-md">
                  <p className="text-center text-gray-500">Knowledge Base AI Configuration Content - Placeholder</p>
                </div>
              )}
              {activeAiConfigTab === 'advanced' && (
                <div className="p-4 border border-dashed border-gray-300 rounded-md">
                  <p className="text-center text-gray-500">Advanced AI Configuration Content - Placeholder</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeMainView === 'dashboard' && (
           <div className="w-full max-w-5xl p-6 md:p-8 rounded-lg shadow-xl bg-white">
            <h2 className="text-2xl font-semibold text-gray-800 text-center">Dashboard</h2>
            <p className="text-gray-600 text-center mt-4">Dashboard content will go here.</p>
          </div>
        )}

        {activeMainView === 'admin' && (
          <div className="w-full max-w-5xl p-6 md:p-8 rounded-lg shadow-xl bg-white">
            <h2 className="text-2xl font-semibold text-gray-800 text-center">Admin</h2>
            <p className="text-gray-600 text-center mt-4">Admin panel content will go here.</p>
          </div>
        )}
      </div>
      )}

      {/* Floating Action Button to toggle Config Panel (only for create view) */ 
      {activeMainView === 'create' && (
          <button 
            onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
            className="fixed bottom-8 right-8 bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-xl z-[1001] no-print transition-transform duration-150 ease-in-out hover:scale-110 active:scale-95"
            title={isConfigPanelOpen ? "Close Configuration" : "Open Configuration"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
      )}
    </>
  );
};

export default LicensingRegistry;
