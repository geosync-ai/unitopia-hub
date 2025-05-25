import React, { useState, useEffect, useRef } from 'react';
import HtmlLicensePreview from '../components/HtmlLicensePreview';
import { MainView, FormData } from '../modules/licensing/types';
import { allLicenseOptions, placeholderLicenseType } from '../modules/licensing/constants';
import type { LicenseTypeData } from '../modules/licensing/constants';
import {
  useLicensingForm,
  useElementStyles,
  usePreviewSettings,
  useDownloadHandlers
} from '../modules/licensing/hooks';
import LicensingHeader from '../modules/licensing/components/LicensingHeader';
import CreateViewForm from '../modules/licensing/components/CreateViewForm';
import ConfigurationPanel from '../modules/licensing/components/ConfigurationPanel';
import PlaceholderView from '../modules/licensing/components/PlaceholderView';
import FloatingActionButton from '../modules/licensing/components/FloatingActionButton';
import LicenseRegistryTable from '../modules/licensing/components/LicenseRegistryTable';
import { format } from 'date-fns';
import { licensesService } from '../integrations/supabase/supabaseClient';
import { useMicrosoftGraph } from '@/hooks/useMicrosoftGraph.tsx';
import html2canvas from 'html2canvas';

// Manually define the expected type for the hook's return
// This should align with the actual return object of useMicrosoftGraph.tsx
interface ExpectedGraphContextType {
  isLoading: boolean;
  lastError: string | null;
  getAuthStatus: () => any; 
  getAccessToken: () => Promise<string>;
  getClient: () => Promise<any>; 
  getOneDriveDocuments?: (() => Promise<any[] | null>) | undefined;
  getFolderContents?: ((folderId: string) => Promise<any[] | null>) | undefined;
  createFolder?: ((folderName: string, parentFolderId?: string) => Promise<any | null>) | undefined;
  renameFolder?: ((folderId: string, newName: string) => Promise<boolean>) | undefined;
  deleteFolder?: ((folderId: string) => Promise<boolean>) | undefined;
  createCsvFile?: ((fileName: string, initialContent?: string, parentFolderIdInput?: string | null | unknown) => Promise<any | null>) | undefined;
  directFileUpload?: ((fileName: string, content: string, parentFolderId: string) => Promise<any | null>) | undefined;
  readCsvFile?: ((fileIdInput: string | null | undefined) => Promise<string>) | undefined;
  updateCsvFile?: ((fileIdInput: string | null | undefined, content: string) => Promise<boolean>) | undefined;
  handleLogin?: (() => Promise<any | null>) | undefined;
  uploadFileToSharePointLibrary?: (file: File) => Promise<string | null>;
  uploadBinaryFileToSharePoint?: (file: File, fileName: string, sitePath: string, libraryName: string, targetFolderPath?: string) => Promise<string | null>;
}

// Define SharePoint target path details
const SHAREPOINT_SITEPATH = "/sites/scpngintranet"; 
const SHAREPOINT_LIBRARY_NAME = "Capital Market Licenses";
const SHAREPOINT_TARGET_FOLDER = "GeneratedLicenses"; // Optional: Define a subfolder

const LicensingRegistry: React.FC = () => {
  const initialFormData: FormData = {
    "issuedDate": "DD/MM/YYYY",
    "expiryDate": "DD/MM/YYYY",
    "licenseNumber": "CML000000",
    "licenseeName": "Enter Licensee Name",
    "regulatedActivity": "",
    "legalReference": "",
    "signatoryName": "James Joshua",
    "signatoryTitle": "Acting Chief Executive Officer",
    "leftSections": "",
    "leftAuthorizedActivity": "",
    "rightSideActivityDisplay": ""
  };

  const {
    formData,
    setFormData,
    selectedLicenseType,
    setSelectedLicenseType,
    handleFormInputChange,
    handlePreviewTextUpdate,
  } = useLicensingForm(initialFormData);

  const handleDateChange = (fieldName: keyof FormData, date: Date | undefined) => {
    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: date ? format(date, 'dd/MM/yyyy') : "DD/MM/YYYY",
    }));
  };

  useEffect(() => {
    if (selectedLicenseType && selectedLicenseType.id !== placeholderLicenseType.id) {
      setFormData((prevData: FormData) => ({
        ...prevData,
        regulatedActivity: selectedLicenseType.name,
        leftSections: selectedLicenseType.leftSections,
        leftAuthorizedActivity: selectedLicenseType.leftAuthorizedActivity,
        rightSideActivityDisplay: `TO CARRY ON THE BUSINESS OF ${selectedLicenseType.name.toUpperCase()}`,
        legalReference: selectedLicenseType.rightLegalReference,
      }));
    } else {
      setFormData((prevData: FormData) => ({
        ...prevData,
        regulatedActivity: "",
        leftSections: "",
        leftAuthorizedActivity: "",
        rightSideActivityDisplay: "",
        legalReference: "",
      }));
    }
  }, [selectedLicenseType, setFormData]);

  const {
    elementStyles,
    selectedElementKeysForPanel,
    handleElementStyleChange,
    handleAlignment,
    handleDistribution,
    handleElementSelectInPreview,
    handleElementDragStart,
    handleElementDragStop,
    configCardRefs,
    handleBulkStyleChange,
    setElementStyles
  } = useElementStyles();

  const {
    previewSizePreset,
    previewWidth,
    previewHeight,
    handlePreviewSizeChange,
  } = usePreviewSettings();

  const [activeMainView, setActiveMainView] = useState<MainView>('create');
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState<boolean>(false);
  const [panelPosition, setPanelPosition] = useState({ x: window.innerWidth - 420, y: 60 });

  const licensePreviewRef = useRef<HTMLDivElement>(null);
  const [isUploadingToSharePoint, setIsUploadingToSharePoint] = useState(false);

  const { handlePrint, handleDownloadPdf, handleDownloadJpeg } = useDownloadHandlers(
    licensePreviewRef,
    elementStyles,
    setElementStyles,
    handleBulkStyleChange
  );

  // --- SharePoint Integration ---
  const graphContext = useMicrosoftGraph() as ExpectedGraphContextType;

  /* // Keep for debugging if needed during development
  useEffect(() => {
    console.log("useMicrosoftGraph context:", graphContext);
  }, [graphContext]);
  */

  // Helper function to generate JPEG from the preview div
  const generateLicenseJpegFile = async (): Promise<File | null> => {
    if (!licensePreviewRef.current) {
      console.error("License preview element not found.");
      return null;
    }
    try {
      const canvas = await html2canvas(licensePreviewRef.current, {
        scale: 2, 
        useCORS: true,
        logging: false,
      });
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], "license_image.jpg", { type: "image/jpeg" }));
          } else {
            resolve(null);
          }
        }, "image/jpeg", 0.95);
      });
    } catch (error) {
      console.error("Error generating license image:", error);
      return null;
    }
  };

  // Function to save to database
  const handleSaveToDatabase = async () => {
    setIsUploadingToSharePoint(true);
    let sharepointImageUrl = "";

    try {
      const jpegFile = await generateLicenseJpegFile();

      if (jpegFile && graphContext.uploadBinaryFileToSharePoint) {
        const fileName = `license-${formData.licenseNumber || Date.now()}.jpg`;
        console.log(`Attempting to upload ${fileName} to SharePoint library: ${SHAREPOINT_LIBRARY_NAME}`);
        
        const webUrl = await graphContext.uploadBinaryFileToSharePoint(
          jpegFile, 
          fileName, 
          SHAREPOINT_SITEPATH, 
          SHAREPOINT_LIBRARY_NAME,
          SHAREPOINT_TARGET_FOLDER 
        );

        if (webUrl) {
          sharepointImageUrl = webUrl;
          console.log('Image uploaded to SharePoint:', sharepointImageUrl);
        } else {
          console.error('SharePoint upload returned no URL. Error (if any):', graphContext.lastError);
          alert('Failed to upload image to SharePoint. Proceeding without image URL. Error: ' + graphContext.lastError);
        }
      } else if (!graphContext.uploadBinaryFileToSharePoint) {
        console.error('uploadBinaryFileToSharePoint function is not available on useMicrosoftGraph hook. This may be a caching issue or type problem.');
        alert('SharePoint upload feature is not available (function missing). Please try again or contact support.');
      } else if (!jpegFile) {
        console.error('Failed to generate license JPEG file.');
        alert('Failed to generate license image. Cannot upload to SharePoint.');
      }

      const dataToSave = {
        issued_date: formData.issuedDate,
        expiry_date: formData.expiryDate,
        license_number: formData.licenseNumber,
        licensee_name: formData.licenseeName,
        regulated_activity: formData.regulatedActivity,
        legal_reference: formData.legalReference,
        signatory_name: formData.signatoryName,
        signatory_title: formData.signatoryTitle,
        left_sections: formData.leftSections,
        left_authorized_activity: formData.leftAuthorizedActivity,
        right_side_activity_display: formData.rightSideActivityDisplay,
        license_image_url: sharepointImageUrl,
      };

      console.log("Attempting to save license with data:", dataToSave, "and type ID:", selectedLicenseType.id);

      const result = await licensesService.addLicense(dataToSave, selectedLicenseType.id);
      console.log('License saved successfully:', result);
      alert('License saved successfully! Image URL: ' + (sharepointImageUrl || "Not uploaded."));
    } catch (error) {
      console.error('Failed to save license or upload image:', error);
      alert('Operation failed. See console for details.');
    } finally {
      setIsUploadingToSharePoint(false);
    }
  };

  useEffect(() => {
    if (selectedElementKeysForPanel.length > 0 && isConfigPanelOpen) {
      const firstSelectedKey = selectedElementKeysForPanel[0];
      if (configCardRefs.current[firstSelectedKey]) {
        configCardRefs.current[firstSelectedKey]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedElementKeysForPanel, isConfigPanelOpen, configCardRefs]);

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
      font-family: 'Montserrat';
      src: url('/fonts/Montserrat-Italic.ttf') format('truetype');
      font-weight: normal;
      font-style: italic;
    }
    @font-face {
      font-family: 'LedSledStraight';
      src: url('/fonts/LEDSledStraight.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    @font-face {
        font-family: 'Century Gothic';
        src: url('/fonts/CenturyGothic.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
    }
     @font-face {
        font-family: 'Century Gothic';
        src: url('/fonts/CenturyGothic-Bold.ttf') format('truetype');
        font-weight: bold;
        font-style: normal;
    }
    @font-face {
        font-family: 'Times New Roman';
        src: url('/fonts/times-new-roman-italic.ttf') format('truetype');
        font-weight: normal;
        font-style: italic;
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
     .font-century-gothic {
        font-family: 'Century Gothic', sans-serif;
    }
    .text-xxs {
        font-size: 0.65rem;
    }
    .config-card-highlight {
        border: 2px solid #4F46E5 !important; 
        box-shadow: 0 0 10px rgba(79, 70, 229, 0.5);
    }
  `;

  return (
    <div>
      <style>{pageStyles}</style>

      <LicensingHeader activeMainView={activeMainView} setActiveMainView={setActiveMainView} />

      {activeMainView === 'create' && (
        <div className="flex flex-row flex-1 w-full min-h-screen p-4 gap-4 items-start">
          <div className="w-3/5 flex flex-col items-center justify-start py-4 px-2 overflow-y-auto">
            <div id="htmlLicensePreviewPrintContainer" className={`w-full max-w-5xl no-print flex justify-center h-full`}>
              <HtmlLicensePreview
                ref={licensePreviewRef}
                formData={formData}
                elementStyles={elementStyles}
                onElementStyleChange={handleElementStyleChange}
                previewWidth={previewWidth}
                previewHeight={previewHeight}
                selectedElementKeys={selectedElementKeysForPanel}
                onElementSelect={handleElementSelectInPreview}
                onElementDragStart={handleElementDragStart}
                onElementDragStop={handleElementDragStop}
                onTextChange={handlePreviewTextUpdate}
              />
            </div>
          </div>

          <div 
            className="w-2/5 flex flex-col no-print overflow-y-auto bg-white shadow-lg rounded-lg border border-gray-200 mt-10"
            style={{ height: `${previewHeight}px` }}
          >
            <CreateViewForm 
              formData={formData}
              selectedLicenseType={selectedLicenseType}
              licenseOptions={allLicenseOptions}
              onFormInputChange={handleFormInputChange}
              onDateChange={handleDateChange}
              onPrint={handlePrint}
              onDownloadPdf={handleDownloadPdf}
              onDownloadJpeg={handleDownloadJpeg}
              onSaveToDatabase={handleSaveToDatabase}
            />
          </div>

          {isConfigPanelOpen && (
            <ConfigurationPanel
              isOpen={isConfigPanelOpen}
              panelPosition={panelPosition}
              setPanelPosition={setPanelPosition}
              formData={formData}
              elementStyles={elementStyles}
              previewSizePreset={previewSizePreset}
              previewWidth={previewWidth}
              previewHeight={previewHeight}
              selectedElementKeysForPanel={selectedElementKeysForPanel}
              configCardRefs={configCardRefs}
              onElementStyleChange={handleElementStyleChange}
              onPreviewSizeChange={handlePreviewSizeChange}
              onAlignment={handleAlignment}
              onDistribution={handleDistribution}
            />
          )}
        </div>
      )}

      {activeMainView === 'registry' && (
        <div className="pt-16">
          <LicenseRegistryTable />
        </div>
      )}

      {activeMainView !== 'create' && activeMainView !== 'registry' && (
         <div className="flex-1 min-h-screen flex flex-col items-center justify-start py-8 px-4 overflow-auto">
           {activeMainView === 'settings' && (
             <PlaceholderView viewName="Settings" />
           )}
           {activeMainView === 'dashboard' && (
             <PlaceholderView viewName="Dashboard" />
           )}
           {activeMainView === 'admin' && (
             <PlaceholderView viewName="Admin" />
           )}
       </div>
      )}

      {activeMainView === 'create' && (
        <FloatingActionButton
            onClick={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
          isOpen={isConfigPanelOpen}
        />
      )}
    </div>
  );
};

export default LicensingRegistry;