const puppeteer = require("puppeteer");
const connectDB = require("./db");
const generateAnswer = require("./utils/answerGenerator");
const uploadResume = require("./utils/uploadResume");
require("dotenv").config();

(async () => {
  await connectDB();
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();

  // Set User-Agent for human-like behavior
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
  );

  //Linked Login
  await page.goto("https://www.linkedin.com/login", {
    waitUntil: "networkidle2",
  });
  // It means Puppeteer will wait until there are no more than 2 network connections for at least 500 ms. It's useful for pages with heavy assets (e.g., images, ads) that take time to load.

  await page.type("#username", process.env.LINKEDIN_EMAIL, { delay: 100 });
  await page.type("#password", process.env.LINKEDIN_PASSWORD, { delay: 100 });
  await page.click('button[type="submit"]');
  await page.waitForNavigation({
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  //check for two factor authentication code input
  const codeInputSelector = 'input[name="pin"]';
  const isCodeRequired = await page.$(codeInputSelector);
  if (isCodeRequired) {
    console.log("Two-Factor Authentication detected. Please enter the code");
    await page.waitForSelector(codeInputSelector,{timeout:6000});
  }

  //Search for jobs
  const jobKeyword = "Software Engineer";
  const jobLocation = "Gurugram";

  const maxRetries = 3;
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      await page.goto(
        `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
          jobKeyword
        )}&location=${encodeURIComponent(jobLocation)}`,
        { waitUntil: "domcontentloaded", timeout: 60000 }
      );
      break; // Break loop on success
    } catch (error) {
      attempts++;
      console.error(
        `Navigation failed, retrying... (${attempts}/${maxRetries})`
      );
      await page.waitForTimeout(2000); // Wait before retrying
    }
  }
  await page.waitForSelector(".jobs-search-results-list__header", {
    visible: true,
    timeout: 60000,
  });

  //Pagination Handling
  let hasNextPage = true;
  while (hasNextPage) {
    // Scroll to load all jobs
    let previousJobCount = 0;
    let currentJobCount = 0;
    do{
        previousJobCount = currentJobCount;
        await page.evaluate(()=> window.scrollBy(0,window.innerHeight));
        await new Promise((resolve)=> setTimeout(resolve,1000));
        currentJobCount = (await page.$$(".job-card-container")).length;
    }while(currentJobCount > previousJobCount);
    const jobs = await page.$$(".job-card-container");
    // The double dollar sign ($$) is used to select all matching elements, not just the first one.It returns an array of ElementHandles

    for (let job of jobs) {
      try {
        const title = await job.$eval(
          ".job-card-list__title--link span strong",
          (el) => el.innerText.trim()
        );
        const company = await job.$eval(
          ".artdeco-entity-lockup__subtitle span",
          (el) => el.innerText.trim()
        );
        const location = await job.$eval(
          ".job-card-container__metadata-wrapper li span",
          (el) => el.innerText.trim()
        );
        console.log("title:", title);
        console.log("company:", company);
        console.log("location:", location);

        const easyApply = await job.$$eval(
            ".job-card-list__footer-wrapper li",
            (listItems) => {
              const lastItem = listItems[listItems.length - 1];
              return lastItem
                ? lastItem.innerText.trim().includes("Easy Apply")
                : false;
            }
          );
        if (easyApply) {
          await job.click(); //  Click to get job description
          await page.waitForSelector(".jobs-description-content", {
            visible: true,
            timeout: 60000,
          });
          const description = await page.evaluate(() => {
            const spans = Array.from(
              document.querySelectorAll(".jobs-description__content p span")
            );
            return spans
              .map((span) => {
                // Check if the span contains a nested p tag or has direct text
                const nestedP = span.querySelector("p");
                return nestedP
                  ? nestedP.innerText.trim()
                  : span.innerText.trim();
              })
              .join(" ");
          });
          console.log("Description:", description);

          //Apply for the job
          const applyButton = await page.$("button.jobs-apply-button");
          if (applyButton) {
            await applyButton.click();
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Human-like delay

            let iterationCount = 0; // Counter to limit iterations
            const maxIterations = 10; // Set a max limit to avoid infinite loops
            while (iterationCount < maxIterations) {
              // const inputs = await page.$$('input, textarea,select');//Get all input fields
              const labels = await page.$$(
                ".fb-dash-form-element__label span, .artdeco-text-input--label"
              );
               const isUploadRequired = await page.$(
                 ".js-jobs-document-upload__container"
               );

               if (isUploadRequired) {
                 console.log("Before checking");
                 const resumePath = "./files/resume.pdf";
                 await uploadResume(page, resumePath);
                 console.log("After checking");
               }

              for (let label of labels) {
               console.log("Inside question section");

               
                // Get the text content of the label
                const question = await page.evaluate(
                  (el) => el.innerText?.trim(),
                  label
                );

                // Skip if the question is empty or irrelevant
                if (
                  !question ||
                  /(search|filter|find|sort)/i.test(
                    question
                  )
                ) {
                  continue;
                }

                const input = await page.evaluateHandle((label) => {
                  //check the next sibling or find the nearest input field
                  let inputElement = label.parentElement.querySelector(
                    "input, textarea, select"
                  );
                  if (!inputElement) {
                    inputElement = label
                      .closest(".fb-dash-form-element__label")
                      ?.nextElementSibling?.querySelector(
                        "input, textarea, select"
                      );
                  }
                  // If not found, check the parent's parent element
                  if (!inputElement) {
                    inputElement =
                      label.parentElement.parentElement?.querySelector(
                        "input, textarea, select"
                      );
                  }
                  return inputElement;
                }, label);

                if (input) {
                  const inputType = await page.evaluate(
                    (el) => el?.type || el.tagName.toLowerCase(),
                    input
                  );

                  console.log(`Question Detected: ${question}`);
                  if (inputType === "select-one") {
                    const selectedIndex = await page.evaluate(
                      (el) => el.selectedIndex,
                      input
                    );
                    if (selectedIndex <= 0) {
                      await page.evaluate(
                        (el) => (el.selectedIndex = 1),
                        input
                      );
                    }
                  }
                  else if (
                    inputType === "checkbox" ||
                    inputType === "radio"
                  ) {
                    const isChecked = await page.evaluate(
                      (el) => el.checked,
                      input
                    );
                    if (!isChecked) {
                      await input.click();
                    }
                  } 
                  else if (inputType === "text" || inputType === "textarea") {
                    const existingValue = await page.evaluate(
                      (el) => el.value?.trim(),
                      input
                    );
                    if (!existingValue) {
                      const answer = await generateAnswer(question);
                      if (answer) {
                        await input.type(answer, { delay: 100 });
                      }
                    }
                  }
                   
                }
              }

              //check for the "Next" button
              const nextButton = await page.$(
                'button[aria-label="Continue to next step"]'
              );
              if (nextButton) {
                const isDisabled = await page.evaluate(
                  (el) =>  el.classList.contains("disabled") || el.disabled,
                  nextButton
                );
                if (!isDisabled) {
                  console.log(
                    "Next button found, clicking to go to the next step."
                  );
                //   await page.evaluate((el) => el.scrollIntoView(), nextButton);

                  await nextButton.click();

                  try {
                    await page.waitForNavigation({ waitUntil: "domcontentloaded" });
                  } catch (error) {
                    console.log("Next button catch but, continuing...");
                    // break;
                  }

                //   await new Promise((resolve) => setTimeout(resolve, 3000));
                  if (iterationCount >= maxIterations) {
                    console.log("Reached max iterations, stopping loop.");
                    break;
                  }
                } else {
                    console.log("Next button is disabled, stopping loop.");
                    break;
                  }
                continue;
              }

              // check for the "Review" button
              const reviewButton = await page.$('button[aria-label="Review your application"]');
              if (reviewButton) {
                console.log(
                  "Review button found, clicking to review the application"
                );
                await reviewButton.click();
                await new Promise((resolve) => setTimeout(resolve, 1000));
                break;
              }
              console.log(
                "No next or review button found, stopping the auto-filling process"
              );
              break;
            }

            const submitButton = await page.$(
              'button[aria-label="Submit application"]'
            );
            if (submitButton) {
              await submitButton.click();
              console.log("Applied for job");
            } else {
              console.log("Submit button not found");
            }
          } else {
            console.log("Easy apply not found");
          }
        } else {
          console.log("Skipping non-easy apply job");
        }
      } catch (error) {
        console.error("Error scraping job: ", error);
      }
    }

    //check for next page
    const nextPageButton = await page.$(".jobs-search-pagination__button--next");
    if (nextPageButton) {
      const isDisabled = await page.evaluate(
        (el) => el.disabled,
        nextPageButton
      );
      if (!isDisabled) {
        console.log("Navigating to the next page...");
        await nextPageButton.click();
        await page.waitForNavigation({ waitUntil: "domcontentloaded" });
      } else {
        hasNextPage = false;
        console.log("No more pages to scrape.");
      }
    } else {
      hasNextPage = false;
      console.log("Next button not found.");
    }
  }
  await browser.close();
})();
