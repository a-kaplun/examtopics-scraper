import { Question, ScraperState } from "@/lib/scraper";
import { ChangeEvent, FC, useContext, useEffect, useRef, useState } from "react";
import Dropzone from "@/components/ui/dropzone";
import { FaFileUpload, FaSortNumericDown, FaRandom } from "react-icons/fa";
import classNames from "classnames";
import _ from "lodash";

const voteColors = [
  "bg-red-300",
  "bg-amber-300",
  "bg-yellow-300",
  "bg-green-300",
  "bg-cyan-300",
  "bg-blue-300",
  "bg-purple-300",
  "bg-pink-300",
];

const Test = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [state, setState] = useState<ScraperState>();
  const [currentQuestion, setCurrentQuestion] = useState<Question>();
  const [questions, setQuestions] = useState<Question[]>();
  const [pastQuestionUrls, setPastQuestionUrls] = useState<string[]>([]);
  const [order, setOrder] = useState<"ascending" | "random">("ascending");

  const handleReadFile = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = (e.target?.result);
      if (typeof text === "string") {
        const data = JSON.parse(text);
        setState(data);
      }
    };
    const file = e.target.files?.[0];
    if (file) {
      reader.readAsText(file);
    }
  };

  const handleToggleOrder = () => {
    setOrder(prev => {
      if (prev === "ascending") return "random";
      return "ascending";
    });
  };

  const handlePrev = () => {
    if (!questions || pastQuestionUrls.length < 1) return;
    const lastQuestionUrl = pastQuestionUrls[pastQuestionUrls.length - 1];
    const question = questions.find(e => e.url === lastQuestionUrl);
    // Remove last
    setPastQuestionUrls(prev => prev.slice(0, prev.length - 1));
    // Set last as current
    setCurrentQuestion(question);
  };

  const handleNext = () => {
    if (!questions) return;
    let index;
    if (order === "ascending") {
      if (currentQuestion) {
        index = questions.findIndex(e => e.url === currentQuestion?.url);
        if (index === -1) {
          index = undefined;
        } else if (index >= questions.length - 1) {
          index = 0;
        } else {
          // Next
          index += 1;
        }
      } else {
        index = 0;
      }
    } else if (order === "random") {
      index = Math.floor(Math.random() * questions?.length);
    }
    if (index !== undefined) {
      if (currentQuestion?.url) {
        // Store past questions
        setPastQuestionUrls(prev => [...prev, currentQuestion.url!]);
      }
      setCurrentQuestion(questions[index]);
    }
  };

  const isLoaded = state?.provider && state?.examCode && state?.questions;

  useEffect(() => {
    // Reset current question
    setCurrentQuestion(undefined);
    if (state?.questions) {
      setQuestions(_.sortBy(state?.questions, ['topic', 'index']));
    }
  }, [state]);

  return (
    <div className="h-full max-w-[48rem] mx-auto flex flex-col justify-center">
      <div className="flex gap-2 mb-4">
        <Dropzone
          className={classNames("flex-1", {
            "button-default": isLoaded
          })}
          boxClassName={classNames({
            "bg-transparent border-none hover:bg-transparent": isLoaded
          })}
          labelClassName={classNames({
            "bg-transparent text-white p-0": isLoaded
          })}
          label={!isLoaded ? "Import questions data" : `${state?.provider?.toUpperCase()} ${state?.examCode?.toUpperCase()}`}
          helperText={!isLoaded ? "JSON" : undefined}
          icon={!isLoaded ?
            <FaFileUpload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" /> :
            undefined
          }
          accept=".json"
          onChange={handleReadFile}
        />
        {isLoaded && <button
          className="button-alt py-1 px-3"
          onClick={handleToggleOrder}
        >
          {order === "ascending" && <FaSortNumericDown size="1.25rem" />}
          {order === "random" && <FaRandom size="1.25rem" />}
        </button>}
      </div>
      {currentQuestion && <QuestionPage {...currentQuestion} />}
      {isLoaded && <div className="flex gap-4">
        {pastQuestionUrls.length > 0 &&
          <button
            className="button-alt flex-1"
            onClick={handlePrev}
          >
            Previous
          </button>
        }
        <button
          className="button-default flex-1"
          onClick={handleNext}
        >
          {currentQuestion ? "Next" : "Start"}
        </button>
      </div>
      }
    </div>
  );
};

const QuestionPage: FC<Question> = ({
  topic, index, url, body, options, answer, answerDescription, votes, comments
}) => {
  const [visible, setVisible] = useState(false);
  const voteCount = votes?.reduce((prev, curr) => prev + curr.count, 0);

  useEffect(() => {
    setVisible(false);
  }, [url]);

  return <div className="mb-4">
    <div
      className="text-lg font-semibold cursor-pointer mb-2"
      onClick={() => window.open(url, '_blank')}>
      {`Topic ${topic} Question ${index}`}
    </div>
    <div
      className="question-body"
      dangerouslySetInnerHTML={{ __html: body ?? "" }}
    />
    {options && <>
      <hr className="my-4" />
      <div className="font-semibold mb-2">
        Options
      </div>
      <div>
        {options?.map((e, i) => <div key={i} dangerouslySetInnerHTML={{ __html: e }} />)}
      </div>
    </>
    }
    <hr className="my-4" />
    <button
      className="button-default w-full"
      onClick={() => setVisible(prev => !prev)}
    >
      {visible ? "Hide" : "Show"} answer
    </button>
    {visible && <>
      <div className="font-semibold my-2">
        Suggested answer
      </div>
      <div dangerouslySetInnerHTML={{ __html: answer ?? "" }} />
      {answerDescription && <>
        <div className="font-semibold my-2">
          Description
        </div>
        <div
          className="border rounded-md p-2"
          dangerouslySetInnerHTML={{ __html: answerDescription ?? "" }}
        />
      </>
      }
      {voteCount && <>
        <div className="font-semibold my-2">
          Votes
        </div>
        <div className="flex w-full rounded-md">
          {votes && votes?.map((e, i) => {
            const percent = `${Math.round((e.count / voteCount) * 100)}%`;
            return <div
              key={i}
              className={`text-xs p-1 white-space-nowrap overflow-x-clip ${voteColors[i]}`}
              style={{ width: percent }}
            >
              {`${e.answer} ${percent}`}
            </div>;
          })}
        </div>
      </>}
    </>}
    {visible && <>
      <hr className="my-4" />
      <div className="font-semibold mb-2">
        Comments
      </div>
      <div className="flex flex-col gap-2">
        {comments && comments?.map((e, i) => <div
          key={i}
          className="border rounded-md p-2"
        >
          {e}
        </div>)}
      </div>
    </>}
  </div>;
};

export default Test;