package mcc.mymcc2;

import android.app.Activity;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.squareup.picasso.Picasso;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.w3c.dom.Text;

import java.io.IOException;
import java.text.ParseException;
import java.util.Arrays;
import java.util.Comparator;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class PhotoAdapter extends BaseAdapter
{
    private static final String LOG_TAG = "MCC-PhotoAdapter";

    private final OkHttpClient httpClient;
    private final Picasso picasso;
    private final Activity activity;

    private Photo[] photos;

    public PhotoAdapter(Activity activity)
    {
        httpClient = new OkHttpClient();
        picasso = Picasso.get();
        this.activity = activity;
        photos = new Photo[0];
    }

    public void update(String url, final Comparator<Photo> comparator)
    {
        Log.v(LOG_TAG, "Fetching URL...");
        Request request = new Request.Builder().url(url).build();
        httpClient.newCall(request).enqueue(new Callback()
        {
            @Override
            public void onFailure(Call call, IOException exc)
            {
                Log.e(LOG_TAG, "Exception while fetching URL", exc);
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException
            {
                try
                {
                    Log.v(LOG_TAG, "URL Fetched...");
                    photos = toNormalArray(new JSONArray(response.body().string()));
                    Arrays.sort(photos, comparator);
                    activity.runOnUiThread(new Runnable()
                    {
                        @Override
                        public void run()
                        {
                            Log.v(LOG_TAG, "Updating UI...");
                            notifyDataSetChanged();
                        }
                    });
                }
                catch (Exception exc)
                {
                    Log.e(LOG_TAG, "Exception while parsing JSON", exc);
                }
            }
        });
    }

    private Photo[] toNormalArray(JSONArray array) throws JSONException, ParseException
    {
        Photo[] result = new Photo[array.length()];
        for (int i = 0; i < array.length(); i++)
        {
            JSONObject object = array.getJSONObject(i);
            result[i] = new Photo(object.getString("photo"), object.getString("author"), object.getString("date"));
        }
        return result;
    }

    @Override
    public long getItemId(int position)
    {
        return position;
    }

    @Override
    public Photo getItem(int position)
    {
        return photos[position];
    }

    @Override
    public int getCount()
    {
        return photos.length;
    }

    @Override
    public View getView(int position, View prevView, ViewGroup viewGroup)
    {
        LinearLayout layout = (LinearLayout) prevView;
        ImageView imageView;
        TextView textView;
        if (layout == null)
        {
            imageView = new ImageView(activity.getApplicationContext());
            imageView.setAdjustViewBounds(true);
            imageView.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
            imageView.setMaxHeight(150);
            imageView.setMaxWidth(150);

            textView = new TextView(activity.getApplicationContext());
            textView.setMaxWidth(150);
            textView.setTextAlignment(View.TEXT_ALIGNMENT_CENTER);
            textView.setMinLines(2);

            layout = new LinearLayout(activity.getApplicationContext());
            layout.setOrientation(LinearLayout.VERTICAL);
            layout.setPadding(5,5,5,5);
            layout.addView(imageView);
            layout.addView(textView);
        }
        else
        {
            imageView = (ImageView) layout.getChildAt(0);
            textView = (TextView) layout.getChildAt(1);
        }
        picasso.load(photos[position].url).into(imageView);
        textView.setText(photos[position].author);
        return layout;
    }
}
