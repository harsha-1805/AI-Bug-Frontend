import axiosInstance from "../api/axiosInstance";

const AI_BASE = "/api/v1/ai";

export const aiBugService = {
  /**
   * @param {Object} evidence
   * @param {File} evidence.image - required screenshot
   * @param {string} [evidence.userDescription]
   * @param {string} [evidence.consoleLog]
   * @param {string} [evidence.stackTrace]
   * @param {string} [evidence.browserUrl]
   * @returns {Promise<{bug_report: object, low_confidence: boolean, model_used: string}>}
   */
  async generateBug({ image, userDescription, consoleLog, stackTrace, browserUrl }) {
    const formData = new FormData();
    formData.append("image", image);
    if (userDescription) formData.append("user_description", userDescription);
    if (consoleLog) formData.append("console_log", consoleLog);
    if (stackTrace) formData.append("stack_trace", stackTrace);
    if (browserUrl) formData.append("browser_url", browserUrl);

    // Note: no explicit Content-Type header here on purpose — axios
    // detects the FormData body and lets the browser set
    // `multipart/form-data; boundary=...` itself. Setting it manually
    // would drop the boundary and break the upload.
    const { data } = await axiosInstance.post(`${AI_BASE}/generate-bug`, formData);
    return data;
  },
};
