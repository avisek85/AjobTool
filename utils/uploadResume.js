const path = require('path');
const resumePath1 = path.resolve(__dirname, './files/resume.pdf');

// page: The Puppeteer page object you're working with.
const uploadResume = async (page, resumePath = resumePath1) => {
  try {
    console.log("Checking for resume upload field...");
    const isUploadRequired = await page.$('input[name="file"]');
    if (isUploadRequired) {
      console.log("Resume required. Uploading...");

    //   // 0 Make the hidden input field visible
    //   await page.evaluate(() => {
    //     const fileInput = document.querySelector('input[name="file"]');
    //     if (fileInput) {
    //       fileInput.classList.remove("hidden");
    //       fileInput.style.display = "block";
    //       fileInput.style.visibility = "visible";
    //     }
    //   });

      //1 upload the resume directly using uploadFile()
      await isUploadRequired.uploadFile(resumePath1);
    //   resumePath = resumePath1;
      console.log("Resume selected and uploaded");



      /*
      // 1 Locate the file input element
      const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click('input[name="file"]'),
      ]);
      
      // Using destructuring to get the first value from the array returned by Promise.all().
      // This value is a FileChooser object that Puppeteer will use to select the resume.
      
      // await Promise.all([...])  Runs multiple asynchronous actions in parallel, waiting for all of them to complete.
      
      // page.waitForFileChooser(): Waits for LinkedIn to open the file chooser dialog.
      
      // 2 Upload the resume
      */
      /*
      await fileChooser.accept([resumePath]);
      console.log("Resume selected.");
      
      // .accept() is a Puppeteer method that simulates choosing a file in the file chooser dialog. .accept() method of fileChooser expects an array of file paths as an argument
      
      //3 Wait for the upload confirmation
      */
      await page
        .waitForSelector(".upload-success-message", { timeout: 5000 })
        .catch(() =>
          console.log("Upload confirmation not found, proceeding anyway...")
        );

      console.log("Resume uploaded successfully");
    } else {
      console.log("No resume upload required here");
    }
  } catch (error) {
    console.error("Error in uploading resume1: ", error);
  }
};

module.exports = uploadResume;
