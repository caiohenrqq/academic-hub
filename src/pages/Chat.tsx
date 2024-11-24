import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonFooter,
  IonInput,
  IonFabButton,
} from "@ionic/react";
import { paperPlane, arrowBack } from "ionicons/icons";
import "./Style.css";
import { useParams } from "react-router-dom";
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore";
import { database } from "../firebase";

const Chat: React.FC = () => {  
  const { topicId } = useParams<{ topicId: string }>();
  const [topicName, setTopicName] = useState<string | null>(null); // Topic name state
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ id: string; text: string; sender: string; timestamp: any }[]>([]);

  // Fetch topic name based on topicId
  useEffect(() => {
    const fetchTopicName = async () => {
      try {
        const topicDoc = doc(database, "topics", topicId);
        const topicSnapshot = await getDoc(topicDoc);

        if (topicSnapshot.exists()) {
          setTopicName(topicSnapshot.data().name || "Unknown Topic");
        } else {
          setTopicName("Topic Not Found");
        }
      } catch (error) {
        console.error("Error fetching topic name:", error);
        setTopicName("Error Loading Topic");
      }
    };

    fetchTopicName();
  }, [topicId]);

  // Fetch and listen for messages
  useEffect(() => {
    const messagesPath = collection(database, `topics/${topicId}/messages`);
    const q = query(messagesPath, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any
      );
    });

    return () => unsubscribe();
  }, [topicId]);

  const handleSendMessage = async () => {
    if (message.trim()) {
      const messagesPath = collection(database, `topics/${topicId}/messages`);
      await addDoc(messagesPath, {
        text: message,
        sender: "currentUserId", 
        timestamp: new Date(),
      });
      setMessage(""); 
    }
  };

  return (
    <div className="chat-view">
      {/* Chat Header */}
      <IonHeader>
        <IonButtons slot="start">
          <IonButton routerLink="/topicos">
            <IonIcon icon={arrowBack} />
          </IonButton>
        </IonButtons>
        <IonTitle>{topicName || "Loading..."}</IonTitle>
      </IonHeader>

      {/* Chat Content */}
      <IonContent className="chat-content">
        <div className="messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.sender === "currentUserId" ? "message-sent" : "message-received"}`}
            >
              {msg.text}
            </div>
          ))}
        </div>
      </IonContent>

      {/* Message Input */}
      <IonFooter>
        <div className="message-input-container">
          <IonInput
            value={message}
            onIonChange={(e) => setMessage(e.detail.value!)}
            placeholder="Type a message..."
            className="input"
            clearInput={true}
          />
          <IonFabButton onClick={handleSendMessage}>
            <IonIcon icon={paperPlane} />
          </IonFabButton>
        </div>
      </IonFooter>
    </div>
  );
};

export default Chat;
