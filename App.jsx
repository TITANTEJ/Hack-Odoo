// src/App.jsx
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import {
  auth,
  db,
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  onAuthStateChanged,
  appId,
} from './firebase'; // Import Firebase instances and functions
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth"; // Import auth methods
import { increment, runTransaction } from "firebase/firestore"; // Correctly import increment and runTransaction from firebase/firestore

// Create a context for Firebase and User data
const FirebaseContext = createContext(null);

// Custom Hook to use Firebase Context
const useFirebase = () => useContext(FirebaseContext);

// Utility function to get user ID (authenticated or anonymous)
const getUserId = () => auth.currentUser?.uid || crypto.randomUUID();

// --- Reusable Rich Text Editor Component ---
const RichTextEditor = ({ value, onChange, placeholder, className, disabled = false }) => {
  const editorRef = useRef(null);

  // Update editor content when value prop changes (e.g., for loading existing content)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const applyFormat = (command, value = null) => {
    if (disabled) return; // Prevent formatting if disabled
    document.execCommand(command, false, value);
    // Manually trigger onChange to update state after execCommand
    handleInput();
    // Keep focus on the editor after applying format
    editorRef.current.focus();
  };

  return (
    <div className={`border rounded-md ${className} ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white border-gray-300'}`}>
      <div className={`flex flex-wrap p-2 border-b border-gray-200 rounded-t-md ${disabled ? 'bg-gray-200' : 'bg-gray-50'}`}>
        <button type="button" onClick={() => applyFormat('bold')} className="p-1 mx-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Bold" disabled={disabled}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 3a1 1 0 011 1v6a1 1 0 11-2 0V4a1 1 0 011-1zm3.03 8.03a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
        </button>
        <button type="button" onClick={() => applyFormat('italic')} className="p-1 mx-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Italic" disabled={disabled}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 4a1 1 0 00-1 1v10a1 1 0 001 1h2a1 1 0 100-2h-1V6h1a1 1 0 100-2h-2z" /></svg>
        </button>
        <button type="button" onClick={() => applyFormat('strikeThrough')} className="p-1 mx-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Strikethrough" disabled={disabled}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
        </button>
        <button type="button" onClick={() => applyFormat('insertOrderedList')} className="p-1 mx-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Numbered List" disabled={disabled}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
        </button>
        <button type="button" onClick={() => applyFormat('insertUnorderedList')} className="p-1 mx-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Bullet List" disabled={disabled}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
        </button>
        <button type="button" onClick={() => applyFormat('justifyLeft')} className="p-1 mx-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Align Left" disabled={disabled}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
        </button>
        <button type="button" onClick={() => applyFormat('justifyCenter')} className="p-1 mx-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Align Center" disabled={disabled}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
        </button>
        <button type="button" onClick={() => applyFormat('justifyRight')} className="p-1 mx-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Align Right" disabled={disabled}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
        </button>
        {/* Note: Emoji, Hyperlink, Image upload are more complex and not included in this basic execCommand implementation. */}
      </div>
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        className={`min-h-[150px] p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-y-auto ${disabled ? 'text-gray-500' : ''}`}
        placeholder={placeholder}
      ></div>
    </div>
  );
};


// --- Components ---

// Header Component
const Header = ({ setView, navigateToQuestionFromNotification }) => { // Receive setView and navigateToQuestionFromNotification
  const { user, signOutUser, unreadNotificationsCount, notifications, markNotificationAsRead, currentUserData } = useFirebase();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationDropdownRef = useRef(null); // Ref for notification dropdown

  // Effect to close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target) &&
          event.target.closest('.relative button[aria-label="Notifications"]') === null) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notif) => {
    markNotificationAsRead(notif.id);
    setShowNotifications(false); // Close dropdown
    if (notif.link) {
      // Assuming link format is /question/{questionId}
      const match = notif.link.match(/\/question\/(.+)/);
      if (match && match[1]) {
        navigateToQuestionFromNotification(match[1]);
      }
    }
  };

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center rounded-b-lg">
      <h1 className="text-2xl font-bold">StackIt!</h1>
      <nav className="flex items-center space-x-4">
        {user ? (
          <>
            {/* User Profile Info and Sign Out */}
            <div className="flex items-center space-x-2">
                {/* Generic User Icon as PFP placeholder */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a4 4 0 00-4 4h8a4 4 0 00-4-4z" clipRule="evenodd" />
                </svg>
                {/* Safely display user name or email part */}
                <span className="text-sm font-semibold">
                  {currentUserData?.name || (user.email ? user.email.split('@')[0] : 'User')}
                </span>
                <button
                  onClick={signOutUser}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-1 px-3 rounded-md transition duration-300"
                >
                  Sign Out
                </button>
            </div>

            <div className="relative" ref={notificationDropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Notifications"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 text-gray-800">
                  <h3 className="text-lg font-semibold px-4 py-2 border-b">Notifications</h3>
                  {notifications.length === 0 ? (
                    <p className="text-gray-600 px-4 py-2">No new notifications.</p>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-2 border-b last:border-b-0 text-sm ${
                          notif.read ? 'text-gray-500' : 'text-gray-800 font-medium'
                        } hover:bg-gray-100 cursor-pointer`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        {notif.message}
                        <span className="block text-xs text-gray-400">{new Date(notif.timestamp?.toDate()).toLocaleString()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          // For guests, show Sign In and Sign Up buttons
          <>
            <button
              onClick={() => setView('auth')}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-1 px-3 rounded-md transition duration-300"
            >
              Sign In
            </button>
            <button
              onClick={() => setView('auth')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md transition duration-300"
            >
              Sign Up
            </button>
          </>
        )}
      </nav>
    </header>
  );
};

// Question Card Component
const QuestionCard = ({ question, onSelectQuestion }) => {
  return (
    <div
      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={() => onSelectQuestion(question)}
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{question.title}</h2>
      {/* Display description safely using dangerouslySetInnerHTML */}
      <div className="text-gray-600 text-sm mb-3 line-clamp-2" dangerouslySetInnerHTML={{ __html: question.description }}></div>
      <div className="flex flex-wrap gap-2 mb-3">
        {question.tags && question.tags.map((tag, index) => (
          <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex justify-between items-center text-gray-500 text-xs">
        <p>Asked by {question.userName || 'Unknown'} on {new Date(question.timestamp?.toDate()).toLocaleDateString()}</p>
        {/* Display answers count */}
        <p className="font-semibold text-sm">
          {question.answersCount === 0
            ? 'No Answers'
            : `${question.answersCount} Answer${question.answersCount > 1 ? 's' : ''}`}
        </p>
      </div>
    </div>
  );
};

// Ask Question Form Component
const AskQuestionForm = ({ onQuestionPosted }) => {
  const { user, currentUserData, appId } = useFirebase(); // Destructure appId here
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(''); // This will now hold HTML from contenteditable
  const [tagsInput, setTagsInput] = useState(''); // For comma-separated tags
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('You must be logged in to ask a question.');
      return;
    }
    // Check for empty description from contenteditable (can be just '<br>' or empty paragraphs)
    const sanitizedDescription = description.replace(/<p><br><\/p>|<div><br><\/div>|<br>/g, '').trim();
    if (!title || !sanitizedDescription) {
      setError('Title and Description cannot be empty.');
      return;
    }

    const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    try {
      const newQuestionRef = await addDoc(collection(db, `artifacts/${appId}/public/data/questions`), {
        title,
        description: description, // Store HTML content from contenteditable
        tags,
        userId: user.uid,
        userName: currentUserData?.name || user.email,
        timestamp: new Date(),
        answersCount: 0, // Initialize answersCount
        acceptedAnswerId: null,
      });
      setTitle('');
      setDescription(''); // Reset contenteditable content
      setTagsInput('');
      onQuestionPosted(); // Callback to refresh question list

      // Notify the user who posted the question
      await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/notifications`), {
        message: `Your question "${title}" has been successfully posted!`,
        read: false,
        timestamp: new Date(),
        link: `/question/${newQuestionRef.id}` // Link to the newly posted question using its ID
      });

    } catch (err) {
      setError('Failed to post question: ' + err.message);
      console.error("Error posting question:", err);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Ask a New Question</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Short and descriptive title"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description</label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Detailed description of your question."
            className="h-48" // Adjust height as needed
          />
        </div>
        <div className="mb-6">
          <label htmlFor="tags" className="block text-gray-700 text-sm font-bold mb-2">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., React, Firebase, CSS"
          />
        </div>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300"
        >
          Post Question
        </button>
      </form>
    </div>
  );
};

// View Question Component
const ViewQuestion = ({ question, onBackToList, isGuest }) => {
  const { user, currentUserData, appId } = useFirebase(); // Destructure appId here
  const [answers, setAnswers] = useState([]);
  const [newAnswerContent, setNewAnswerContent] = useState(''); // This will hold HTML from contenteditable
  const [error, setError] = useState('');
  const [userVotes, setUserVotes] = useState({}); // State to store user's votes for answers

  const questionId = question.id;
  const isQuestionOwner = user && user.uid === question.userId;

  // Fetch answers in real-time
  useEffect(() => {
    if (!questionId) return;

    const answersRef = collection(db, `artifacts/${appId}/public/data/questions/${questionId}/answers`);
    const q = query(answersRef); // No orderBy to avoid index issues

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedAnswers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort answers by votes (descending) and then by accepted status (accepted first)
      fetchedAnswers.sort((a, b) => {
        if (a.id === question.acceptedAnswerId) return -1; // Accepted answer first
        if (b.id === question.acceptedAnswerId) return 1;
        return (b.upvotes || 0) - (a.upvotes || 0); // Then by upvotes
      });
      setAnswers(fetchedAnswers);
    }, (err) => {
      console.error("Error fetching answers:", err);
      setError("Failed to load answers.");
    });

    return () => unsubscribe();
  }, [questionId, question.acceptedAnswerId, appId]); // Re-run if questionId or acceptedAnswerId changes

  // Fetch user's votes for answers
  useEffect(() => {
    if (!user || !questionId) return;

    const fetchUserVotes = async () => {
      const votesMap = {};
      for (const answer of answers) {
        const voteRef = doc(db, `artifacts/${appId}/public/data/questions/${questionId}/answers/${answer.id}/votes`, user.uid);
        const voteDoc = await getDoc(voteRef);
        if (voteDoc.exists()) {
          votesMap[answer.id] = voteDoc.data().type;
        }
      }
      setUserVotes(votesMap);
    };

    fetchUserVotes();
  }, [user, answers, questionId, appId]); // Re-fetch when user, answers, or questionId changes

  const handlePostAnswer = async (e) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('You must be logged in to post an answer.');
      return;
    }
    // Check for empty content from contenteditable
    const sanitizedNewAnswerContent = newAnswerContent.replace(/<p><br><\/p>|<div><br><\/div>|<br>/g, '').trim();
    if (!sanitizedNewAnswerContent) {
      setError('Answer cannot be empty.');
      return;
    }

    try {
      const answerRef = await addDoc(collection(db, `artifacts/${appId}/public/data/questions/${questionId}/answers`), {
        content: newAnswerContent, // Store HTML content from contenteditable
        userId: user.uid,
        userName: currentUserData?.name || user.email,
        timestamp: new Date(),
        upvotes: 0,
        downvotes: 0,
      });
      setNewAnswerContent(''); // Reset contenteditable content

      // Increment answersCount on the parent question
      await updateDoc(doc(db, `artifacts/${appId}/public/data/questions`, questionId), {
        answersCount: increment(1)
      });

      // Notify question owner
      if (user.uid !== question.userId) { // Don't notify self
        await addDoc(collection(db, `artifacts/${appId}/users/${question.userId}/notifications`), {
          message: `${currentUserData?.name || user.email} answered your question "${question.title}".`,
          read: false,
          timestamp: new Date(),
          link: `/question/${questionId}` // Link back to the question
        });
      }
    } catch (err) {
      setError('Failed to post answer: ' + err.message);
      console.error("Error posting answer:", err);
    }
  };

  const handleVote = async (answerId, type) => {
    if (!user) {
      setError('You must be logged in to vote.');
      return;
    }

    const answerRef = doc(db, `artifacts/${appId}/public/data/questions/${questionId}/answers`, answerId);
    const voteRef = doc(db, `artifacts/${appId}/public/data/questions/${questionId}/answers/${answerId}/votes`, user.uid);

    try {
      await runTransaction(db, async (transaction) => { // Use runTransaction with db as first argument
        const sfDoc = await transaction.get(answerRef);
        if (!sfDoc.exists()) {
          throw "Answer does not exist!";
        }

        let newUpvotes = sfDoc.data().upvotes || 0;
        let newDownvotes = sfDoc.data().downvotes || 0;
        const currentVoteDoc = await transaction.get(voteRef); // Get the user's current vote within the transaction
        let currentVote = currentVoteDoc.exists() ? currentVoteDoc.data().type : null;

        if (type === 'upvote') {
          if (currentVote === 'upvote') {
            // User is undoing their upvote
            newUpvotes--;
            transaction.delete(voteRef);
          } else {
            // User is casting a new upvote or changing from downvote
            newUpvotes++;
            if (currentVote === 'downvote') {
              newDownvotes--; // Remove previous downvote
            }
            transaction.set(voteRef, { type: 'upvote', timestamp: new Date() });
          }
        } else if (type === 'downvote') {
          if (currentVote === 'downvote') {
            // User is undoing their downvote
            newDownvotes--;
            transaction.delete(voteRef);
          } else {
            // User is casting a new downvote or changing from upvote
            newDownvotes++;
            if (currentVote === 'upvote') {
              newUpvotes--; // Remove previous upvote
            }
            transaction.set(voteRef, { type: 'downvote', timestamp: new Date() });
          }
        }

        transaction.update(answerRef, {
          upvotes: newUpvotes,
          downvotes: newDownvotes,
        });
      });
      // After successful transaction, update local state for immediate UI reflection
      // This is crucial because onSnapshot might have a slight delay
      setUserVotes(prev => {
        const newState = { ...prev };
        if (type === 'upvote') {
          newState[answerId] = (prev[answerId] === 'upvote' ? null : 'upvote');
        } else if (type === 'downvote') {
          newState[answerId] = (prev[answerId] === 'downvote' ? null : 'downvote');
        }
        return newState;
      });

    } catch (err) {
      setError('Failed to vote: ' + err.message);
      console.error("Error voting:", err);
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    if (!user || user.uid !== question.userId) {
      setError('Only the question owner can accept an answer.');
      return;
    }
    try {
      await updateDoc(doc(db, `artifacts/${appId}/public/data/questions`, questionId), {
        acceptedAnswerId: question.acceptedAnswerId === answerId ? null : answerId, // Toggle accepted status
      });
      // Notify answer owner
      const acceptedAnswer = answers.find(a => a.id === answerId);
      if (acceptedAnswer && user.uid !== acceptedAnswer.userId) {
        await addDoc(collection(db, `artifacts/${appId}/users/${acceptedAnswer.userId}/notifications`), {
          message: `${currentUserData?.name || user.email} accepted your answer to "${question.title}".`,
          read: false,
          timestamp: new Date(),
          link: `/question/${questionId}`
        });
      }
    } catch (err) {
      setError('Failed to accept answer: ' + err.message);
      console.error("Error accepting answer:", err);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
      <button
        onClick={onBackToList}
        className="mb-4 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition duration-300"
      >
        &larr; Back to Questions
      </button>

      <div className="border-b pb-4 mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-3">{question.title}</h2>
        {/* Display description safely using dangerouslySetInnerHTML */}
        <div className="text-gray-700 mb-4 prose max-w-none" dangerouslySetInnerHTML={{ __html: question.description }}></div>
        <div className="flex flex-wrap gap-2 mb-3">
          {question.tags && question.tags.map((tag, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {tag}
          </span>
        ))}
      </div>
      <p className="text-gray-500 text-sm">Asked by {question.userName || 'Unknown'} on {new Date(question.timestamp?.toDate()).toLocaleDateString()}</p>
    </div>

    <h3 className="text-2xl font-bold text-gray-800 mb-4">Answers ({answers.length})</h3>
    {error && <p className="text-red-500 text-center mb-4">{error}</p>}

    <div className="space-y-6 mb-8">
      {answers.length === 0 ? (
        <p className="text-gray-600">No answers yet. Be the first to answer!</p>
      ) : (
        answers.map((answer) => (
          <div
            key={answer.id}
            className={`bg-gray-50 p-6 rounded-lg shadow-sm flex items-start ${
              answer.id === question.acceptedAnswerId ? 'border-l-4 border-green-500' : ''
            }`}
          >
            <div className="flex-1">
              {/* Display answer content safely using dangerouslySetInnerHTML */}
              <div className="text-gray-800 mb-3 prose max-w-none" dangerouslySetInnerHTML={{ __html: answer.content }}></div>
              <p className="text-gray-500 text-xs">Answered by {answer.userName || 'Unknown'} on {new Date(answer.timestamp?.toDate()).toLocaleDateString()}</p>
            </div>
            {/* Voting buttons moved to the right */}
            <div className="flex flex-col items-center ml-4">
              <button
                onClick={() => handleVote(answer.id, 'upvote')}
                className={`p-1 rounded-full transition duration-200 ${
                  userVotes[answer.id] === 'upvote' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-green-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label="Upvote"
                disabled={isGuest}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 11V13C7 13.5523 7.44772 14 8 14H10V20C10 20.5523 10.4477 21 11 21H13C13.5523 21 14 20.5523 14 20V14H16C16.5523 14 17 13.5523 17 13V11C17 10.4477 16.5523 10 16 10H14V4C14 3.44772 13.5523 3 13 3H11C10.4477 3 10 3.44772 10 4V10H8C7.44772 10 7 10.4477 7 11Z" />
                </svg>
              </button>
              <span className="font-bold text-lg text-gray-800">{answer.upvotes - answer.downvotes}</span>
              <button
                onClick={() => handleVote(answer.id, 'downvote')}
                className={`p-1 rounded-full transition duration-200 ${
                  userVotes[answer.id] === 'downvote' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-red-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label="Downvote"
                disabled={isGuest}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 13V11C17 10.4477 16.5523 10 16 10H14V4C14 3.44772 13.5523 3 13 3H11C10.4477 3 10 3.44772 10 4V10H8C7.44772 10 7 10.4477 7 11V13C7 13.5523 7.44772 14 8 14H10V20C10 20.5523 10.4477 21 11 21H13C13.5523 21 14 20.5523 14 20V14H16C16.5523 14 17 13.5523 17 13Z" />
                </svg>
              </button>
              {isQuestionOwner && (
                <button
                  onClick={() => handleAcceptAnswer(answer.id)}
                  className={`mt-2 p-1 rounded-full ${
                    answer.id === question.acceptedAnswerId
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-green-300'
                  }`}
                  aria-label="Accept Answer"
                  title={answer.id === question.acceptedAnswerId ? "Accepted Answer" : "Accept Answer"}
                  disabled={isGuest} // Disable for guests (though question owner implies logged in)
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>

    {user ? (
      <div className="mt-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Answer</h3>
        <form onSubmit={handlePostAnswer}>
          <RichTextEditor
            value={newAnswerContent}
            onChange={setNewAnswerContent}
            placeholder="Write your answer here..."
            className="h-32" // Adjust height as needed
            disabled={isGuest} // Disable for guests
          />
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isGuest} // Disable for guests
          >
            Post Your Answer
          </button>
        </form>
      </div>
    ) : (
      <p className="text-center text-gray-600 mt-8">Sign in to post an answer.</p>
    )}
  </div>
);
};

// Admin Dashboard Component
const AdminDashboard = () => {
  const { user, currentUserData, appId } = useFirebase(); // Destructure appId here
  const isAdmin = currentUserData?.role === 'admin';
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (!isAdmin) return;

    // Fetch users
    const usersRef = collection(db, `artifacts/${appId}/public/data/users`);
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Error fetching users:", err));

    // Fetch all questions for moderation
    const questionsRef = collection(db, `artifacts/${appId}/public/data/questions`);
    const unsubscribeQuestions = onSnapshot(questionsRef, (snapshot) => {
      const fetchedQuestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort questions by timestamp descending
      fetchedQuestions.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());
      setQuestions(fetchedQuestions);
    }, (err) => console.error("Error fetching all questions:", err));

    return () => {
      unsubscribeUsers();
      unsubscribeQuestions();
    };
  }, [isAdmin, appId]); // Add appId to dependency array

  const toggleUserBan = async (userId, isBanned) => {
    try {
      await updateDoc(doc(db, `artifacts/${appId}/public/data/users`, userId), {
        isBanned: !isBanned
      });
      console.log(`User ${userId} ban status toggled.`);
    } catch (error) {
      console.error("Error toggling user ban:", error);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (window.confirm("Are you sure you want to delete this question and all its answers?")) {
      try {
        // Delete answers subcollection first (Firestore doesn't do this automatically)
        const answersSnapshot = await getDocs(collection(db, `artifacts/${appId}/public/data/questions/${questionId}/answers`));
        const deleteAnswerPromises = answersSnapshot.docs.map(ansDoc => deleteDoc(doc(db, `artifacts/${appId}/public/data/questions/${questionId}/answers`, ansDoc.id)));
        await Promise.all(deleteAnswerPromises);

        await deleteDoc(doc(db, `artifacts/${appId}/public/data/questions`, questionId));
        console.log(`Question ${questionId} deleted.`);
      } catch (error) {
        console.error("Error deleting question:", error);
      }
    }
  };

  if (!isAdmin) {
    return <p className="text-center text-red-500 mt-8">Access Denied: You must be an admin to view this page.</p>;
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Dashboard</h2>

      <section className="mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Manage Users</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">User ID</th>
                <th className="py-3 px-6 text-left">Email</th>
                <th className="py-3 px-6 text-left">Role</th>
                <th className="py-3 px-6 text-left">Status</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{u.id}</td>
                  <td className="py-3 px-6 text-left">{u.email}</td>
                  <td className="py-3 px-6 text-left">{u.role || 'user'}</td>
                  <td className="py-3 px-6 text-left">
                    <span className={`py-1 px-3 rounded-full text-xs ${u.isBanned ? 'bg-red-200 text-red-600' : 'bg-green-200 text-green-600'}`}>
                      {u.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => toggleUserBan(u.id, u.isBanned)}
                      className={`font-bold py-1 px-3 rounded-md text-xs transition duration-300 ${u.isBanned ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                    >
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Moderate Questions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Title</th>
                <th className="py-3 px-6 text-left">Asked By</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-sm font-light">
              {questions.map((q) => (
                <tr key={q.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-6 text-left whitespace-nowrap">{q.title}</td>
                  <td className="py-3 px-6 text-left">{q.userName || 'Unknown'}</td>
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-md text-xs transition duration-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};


// Main App Component
function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [currentUserData, setCurrentUserData] = useState(null); // User data from Firestore
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const [view, setView] = useState('auth'); // Start on the auth page
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Authenticate user on app load
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      if (currentUser) {
        // Fetch user data from Firestore or create if new
        const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, currentUser.uid); // Use appId here
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setCurrentUserData(userDocSnap.data());
        } else {
          // New user, create document
          const newUser = {
            email: currentUser.email,
            name: currentUser.email ? currentUser.email.split('@')[0] : 'New User', // Safer split
            role: 'user', // Default role
            createdAt: new Date(),
          };
          await setDoc(userDocRef, newUser);
          setCurrentUserData(newUser);
        }

        // Redirect to dashboard if authenticated
        setView('dashboard');

        // Listen for notifications
        const notificationsRef = collection(db, `artifacts/${appId}/users/${currentUser.uid}/notifications`); // Use appId here
        const q = query(notificationsRef); // No orderBy to avoid index issues
        const unsubscribeNotifs = onSnapshot(q, (snapshot) => {
          const fetchedNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort by timestamp descending
          fetchedNotifs.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());
          setNotifications(fetchedNotifs);
          setUnreadNotificationsCount(fetchedNotifs.filter(n => !n.read).length);
        }, (err) => console.error("Error fetching notifications:", err));

        return () => unsubscribeNotifs();
      } else {
        setCurrentUserData(null);
        setNotifications([]);
        setUnreadNotificationsCount(0);
        // If user logs out or is not authenticated, ensure we are on the auth screen
        setView('auth');
      }
    });

    return () => unsubscribeAuth();
  }, [appId]); // Added appId to dependency array

  const signOutUser = async () => {
    try {
      await signOut(auth);
      // setView('auth'); // onAuthStateChanged listener will handle this
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/notifications`, notificationId), {
        read: true,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Function to navigate to a specific question from a notification
  const navigateToQuestionFromNotification = async (questionId) => {
    try {
      const questionDocRef = doc(db, `artifacts/${appId}/public/data/questions`, questionId);
      const questionDocSnap = await getDoc(questionDocRef);
      if (questionDocSnap.exists()) {
        setSelectedQuestion({ id: questionDocSnap.id, ...questionDocSnap.data() });
        setView('viewQuestion');
      } else {
        console.warn("Question not found for notification link:", questionId);
        // Optionally show an error message to the user
      }
    } catch (error) {
      console.error("Error navigating to question from notification:", error);
    }
  };


  // --- Question List Management ---
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  useEffect(() => {
    const questionsRef = collection(db, `artifacts/${appId}/public/data/questions`);
    const q = query(questionsRef); // No orderBy to avoid index issues

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedQuestions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort questions by timestamp descending
      fetchedQuestions.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());
      setQuestions(fetchedQuestions);
      setLoadingQuestions(false);
    }, (err) => {
      console.error("Error fetching questions:", err);
      setLoadingQuestions(false);
    });

    return () => unsubscribe();
  }, [appId]); // Add appId to dependency array

  const handleSelectQuestion = (question) => {
    setSelectedQuestion(question);
    setView('viewQuestion');
  };

  const handleBackToList = () => {
    setSelectedQuestion(null);
    setView('dashboard');
  };

  const handleQuestionPosted = () => {
    setView('dashboard'); // Go back to dashboard after posting
  };

  // Render based on view state
  const renderContent = () => {
    if (loadingAuth) {
      return <div className="text-center text-gray-600 text-xl">Loading authentication...</div>;
    }

    // Determine if the current user is a guest (not logged in)
    const isGuest = !user;

    // Authenticated user views
    switch (view) {
      case 'askQuestion':
        return <AskQuestionForm onQuestionPosted={handleQuestionPosted} />;
      case 'viewQuestion':
        return selectedQuestion ? (
          <ViewQuestion question={selectedQuestion} onBackToList={handleBackToList} isGuest={isGuest} />
        ) : (
          <div className="text-center text-gray-600 text-xl">Question not found.</div>
        );
      case 'admin':
        return <AdminDashboard />;
      case 'dashboard':
      default:
        return (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-800">Recent Questions</h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    if (isGuest) {
                      setView('auth'); // Redirect to auth if guest
                    } else {
                      setView('askQuestion');
                    }
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                >
                  Ask Question
                </button>
                {currentUserData?.role === 'admin' && (
                  <button
                    onClick={() => setView('admin')}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                  >
                    Admin Dashboard
                  </button>
                )}
              </div>
            </div>
            {loadingQuestions ? (
              <div className="text-center text-gray-600 text-xl">Loading questions...</div>
            ) : questions.length === 0 ? (
              <p className="text-center text-gray-600 text-lg">No questions yet. Be the first to ask!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {questions.map((question) => (
                  <QuestionCard key={question.id} question={question} onSelectQuestion={handleSelectQuestion} />
                ))}
              </div>
            )}
            {isGuest && (
              <div className="mt-8 p-4 bg-blue-100 border border-blue-200 text-blue-800 rounded-md text-center">
                Please <button onClick={() => setView('auth')} className="underline font-semibold">Sign In or Sign Up</button> to ask questions, post answers, or vote.
              </div>
            )}
          </div>
        );
      case 'auth': // New case for displaying AuthForm explicitly
        return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <AuthForm setView={setView} /> {/* Pass setView to AuthForm */}
          </div>
        );
    }
  };

  // AuthForm Component (Moved here to be accessible within App's renderContent)
  const AuthForm = ({ setView }) => { // Receive setView prop
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // State for user's name
    const [error, setError] = useState('');
    const [mode, setMode] = useState('signIn'); // 'signIn' or 'signUp'
    const [passwordType, setPasswordType] = useState('password'); // 'password' or 'text'

    const handleSignUp = async () => {
      setError(''); // Clear previous errors
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const currentUser = userCredential.user;

        // Create user document in Firestore with name
        const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, currentUser.uid);
        await setDoc(userDocRef, {
          email: currentUser.email,
          name: name || (currentUser.email ? currentUser.email.split('@')[0] : 'New User'), // Safer split
          role: 'user',
          createdAt: new Date(),
        });
        // User state and currentUserData will be updated by onAuthStateChanged listener in App component
        // setView('dashboard'); // This is now handled by onAuthStateChanged in App
      } catch (err) {
        setError(err.message);
        console.error("Sign Up Error:", err);
      }
    };

    const handleSignIn = async () => {
      setError(''); // Clear previous errors
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // User state will be updated by onAuthStateChanged listener in App component
        // setView('dashboard'); // This is now handled by onAuthStateChanged in App
      } catch (err) {
        setError(err.message);
        console.error("Sign In Error:", err);
      }
    };

    const togglePasswordVisibility = () => {
      setPasswordType(prevType => (prevType === 'password' ? 'text' : 'password'));
    };

    return (
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-4xl font-bold text-gray-800 text-center mb-6">Welcome to StackIt!</h1>
        <p className="text-gray-600 text-center mb-6">
          {mode === 'signIn' ? 'Sign in to your account.' : 'Create a new account.'}
        </p>

        {mode === 'signUp' && (
          <input
            type="text"
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
        <input
          type="email"
          placeholder="Email ID"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="relative mb-6">
          <input
            type={passwordType}
            placeholder={mode === 'signUp' ? "Set Password" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800 focus:outline-none"
            aria-label={passwordType === 'password' ? 'Show password' : 'Hide password'}
          >
            {passwordType === 'password' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.879 16.121A4.975 4.975 0 0112 15c1.455 0 2.845.503 3.879 1.379m-1.379-1.379L18 19m-3-6l2.121-2.121M17.817 17.817A9.954 9.954 0 0019 12c-1.275-4.057-5.065-7-9.543-7a9.97 9.97 0 00-1.563.029l-1.414-1.414M10 10l-2.121-2.121" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <div className="flex space-x-4">
          {mode === 'signIn' ? (
            <button
              onClick={handleSignIn}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300"
            >
              Sign In
            </button>
          ) : (
            <button
              onClick={handleSignUp}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-300"
            >
              Sign Up
            </button>
          )}
        </div>
        <p className="text-center text-gray-600 text-sm mt-4">
          {mode === 'signIn' ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => setMode('signUp')} className="text-blue-500 hover:underline font-semibold">
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => setMode('signIn')} className="text-blue-500 hover:underline font-semibold">
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    );
  };


  return (
    <FirebaseContext.Provider value={{
      user,
      currentUserData,
      signOutUser,
      notifications,
      unreadNotificationsCount,
      markNotificationAsRead,
      appId // Provide appId through context for sub-components
    }}>
      <div className="min-h-screen bg-gray-100 font-inter">
        {/* Pass setView and navigateToQuestionFromNotification to Header */}
        <Header setView={setView} navigateToQuestionFromNotification={navigateToQuestionFromNotification} />
        <main className="container mx-auto py-8">
          {renderContent()}
        </main>
      </div>
    </FirebaseContext.Provider>
  );
}

export default App;
