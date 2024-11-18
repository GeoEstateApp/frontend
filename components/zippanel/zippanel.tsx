import { View, Text, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useDebouncedEffect } from '@/hooks/utility-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useZipcodeInsights, ZipcodeData, ZipcodeInsight } from '@/states/zipcode_insights';
import { convexHull, PolygonCoordinates } from '@/api/osm';
import { addComment, Comment, getComments } from '@/api/comments';
import Toast from 'react-native-toast-message';

export default function ZipPanel() {
  const [searchingZipcodeText, setSearchingZipcodeText] = useState<string>('');
  const [zipcodeList, setZipcodeList] = useState<ZipcodeData[]>([]);
  const [viewingZipcodeDetails, setViewingZipcodeDetails] = useState<string | null>(null); // New state to track details view
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');

  const { zipcode, zipcodes, setPolygon, setZipcode, setZipcodes, setZipcodeInsights, zipcodeInsights, setPolygons } = useZipcodeInsights();
  
    
  const handleZipcodeFilter = (text: string) => {
    const filteredZipcodes = zipcodes.filter((zipcodeData) => zipcodeData.zipcode.includes(text) || zipcodeData.name.includes(text));
    setZipcodeList(filteredZipcodes);
  };

  useDebouncedEffect(() => {
    if (searchingZipcodeText === '') {
      setZipcodeList(zipcodes);
      return;
    }

    handleZipcodeFilter(searchingZipcodeText);
  }, 300, [searchingZipcodeText]);

  useEffect(() => {
    if (zipcode === '') return;

    handleZipcodeChange();
  }, [zipcode]);

  useEffect(() => {
    if (zipcodes.length === 0) getAllZipcodes();
  }, []);

  useEffect(() => {
    if (zipcode) {
      handleGetComments(zipcode);
    }
  }, [zipcode]);
  

  const getAllZipcodes = async () => {
    Toast.show({
      type: 'info',
      text1: 'Fetching zipcodes!',
      text2: 'Please wait zipcodes are loading...',
      visibilityTime: 5000,
      autoHide: true,
      topOffset: 20,
      text1Style: { fontSize: 16, fontWeight: 'bold' },
      text2Style: { fontSize: 14 },
    });

    const { idToken, uid } = await getAuthTokens();
    if (!idToken || !uid) {
      console.log('No auth tokens found.');
      return;
    }

    try {
      const response = await fetch(`https://photo-gateway-7fw1yavc.ue.gateway.dev/api/locations`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch zipcode data.');

      const data = await response.json();

      setZipcodes(data.map((item: any) => ({ zipcode: item.zipcode, name: item.name })));
      setZipcodeList(data.map((item: any) => ({ zipcode: item.zipcode, name: item.name })));

      Toast.hide();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  

  const handleGetComments = async (zipcode: string) => {
    try {
      const data = await getComments(zipcode);  
      if (!data) return

      const comments: Comment[] = data.map((comment: Comment) => comment)
      setComments(comments)
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  
  const handleAddComment = async () => {
    if (!newComment.trim()) return; 
  
    try {
      const data = await addComment(zipcode, newComment);  
      if (data) {
        console.log('Comment added succcesfully, ', zipcode);
        setNewComment('');  
        handleGetComments(zipcode);  
      } else {
        console.log('Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };
  
  const handleZipcodeChange = async () => {
    const { idToken, uid } = await getAuthTokens();
    if (!idToken || !uid) {
      console.log('No auth tokens found.');
      return;
    }

    try {
      Toast.show({
        type: 'info',
        text1: 'Fetching zipcode!',
        text2: 'Please wait zipcode is loading...',
        visibilityTime: 5000,
        autoHide: true,
        topOffset: 20,
        text1Style: { fontSize: 16, fontWeight: 'bold' },
        text2Style: { fontSize: 14 },
      });

      const response = await fetch(`https://photo-gateway-7fw1yavc.ue.gateway.dev/api/locations/${zipcode}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch zipcode data.');

      const data = await response.json();

      const coordinates = data[0].geometry.coordinates[0].map((coordinate: number[]) => ({ lat: coordinate[1], lng: coordinate[0], altitude: 150 }));
      setPolygon(convexHull(coordinates));

      const { population, medianAge, medianAgeMale, medianAgeFemale, malePop, femalePop, vacanciesForRentPercent, vacanciesForSalePercent, homeValueForecast } = data[0];
      const insights: ZipcodeInsight = {
        population,
        medianAge,
        medianAgeMale,
        medianAgeFemale,
        malePop,
        femalePop,
        vacanciesForRentPercent,
        vacanciesForSalePercent,
        homeValueForecast,
        state: '',
        city: '',
        county: '',
      };
      setZipcodeInsights(insights);

      Toast.hide();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getAuthTokens = async () => {
    try {
      const idToken = await AsyncStorage.getItem('idToken');
      const uid = await AsyncStorage.getItem('uid');
      return { idToken, uid };
    } catch (error) {
      console.error('Error retrieving auth tokens:', error);
      throw error;
    }
  };

  const handleBackToList = () => {
    setViewingZipcodeDetails(null); 
  };

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        {viewingZipcodeDetails ? (
          <>
            {/* Back button */}
            <Pressable onPress={handleBackToList} style={styles.backButton}>
              <Text>← Back to Zipcode List</Text>
            </Pressable>

            <ScrollView contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
              {/* Zipcode insights */}
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Zipcode Insights:</Text>
              <Text>Population: {zipcodeInsights.population}</Text>
              <Text>Median Age: {zipcodeInsights.medianAge}</Text>
              <Text>Vacancies [Rent]: {zipcodeInsights.vacanciesForRentPercent}</Text>
              <Text>Vacancies [Sale]: {zipcodeInsights.vacanciesForSalePercent}</Text>
              <Text>Home Forecast: {zipcodeInsights.homeValueForecast}</Text>

            <View style={styles.commentSection}>
              <TextInput
                 style={styles.inputComment}
                  placeholder="Post a comment"
                  value={newComment}
                  onChangeText={setNewComment}
              />
              <Pressable onPress={handleAddComment} style={styles.addButton}>
              <Text style={styles.buttonText}>Add Comment</Text>
              </Pressable>  

              <Text style={styles.commentsHeader}>Comments:</Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {
                      comments.map((comment, idx) => {
                        const dateString = comment.created_at;
                        const date = new Date(dateString);
                        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
                        const formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);

                        return (
                          <View style={styles.commentCard} key={idx}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{comment.comment}</Text>
                            <Text style={{ fontSize: 16 }}>- {comment.user_name}</Text>
                            <Text style={{}}>{formattedDate}</Text>
                          </View>
                        )
                      })
                    }
                </ScrollView>
            </View>

            </ScrollView>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={searchingZipcodeText}
              placeholder="Enter zipcode to search"
              onChangeText={(text) => setSearchingZipcodeText(text)}
            />

            <ScrollView contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
              {zipcodeList.map((zip, idx) => (
                <Pressable
                  key={idx}
                  style={{
                    ...styles.zipcodeButton,
                    backgroundColor: zip.zipcode === zipcode ? '#e0e0e0' : '#fff',
                    gap: 20,
                  }}
                  onPress={() => {
                    setZipcode(zip.zipcode);
                    setViewingZipcodeDetails(zip.zipcode); 
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{zip.zipcode}</Text>
                    <Text>{zip.name}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: '100%',
    left: 0,
    display: 'flex',
    flexDirection: 'row',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    backgroundColor: '#fffffff9',
    width: 400,
    height: '100%',
    padding: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    color: '#27272a',
  },
  zipcodeButton: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginBottom: 10,
  },
  commentBox: {
    marginTop: 20,
  },commentSection: {
    marginTop: 20,
  },
  inputComment: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    color: '#27272a',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  commentsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20
  },
  commentCard: {
    backgroundColor: '#fefefe',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  }
});
